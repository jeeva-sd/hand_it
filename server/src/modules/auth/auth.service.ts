import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import * as fs from 'node:fs/promises';
import { promisify } from 'node:util';
import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenType, User, UserStatus, WorkspacePlan } from '@prisma/client';
import { FastifyReply } from 'fastify';
import { EmailsService, PrismaService, R2Service } from '~/integrations';
import { EMAIL_TYPES, EmailType } from '~/integrations/email/email.constants';
import { TokenData } from '~/shared/types/request.type';
import { appConfig } from '~/system/config';
import { AuthRepository } from './auth.repository';
import {
    ForgetPasswordPayload,
    LoginPayload,
    ResetPasswordPayload,
    SignupPayload,
    UpdateProfilePayload,
    UploadProfileImagePayload
} from './schemas';

const scryptAsync = promisify(scrypt);

const PASSWORD_HASH_KEY_LENGTH = 64;
const PASSWORD_HASH_SALT_BYTES = 16;
const AUTH_TOKEN_BYTES = 32;
const PASSWORD_RESET_TTL_MS = 1000 * 60 * 30; // 30 minutes
const ACCOUNT_SETUP_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours
const FORGET_PASSWORD_RESPONSE =
    'If your account exists, we have sent a password link to your registered email address.';

type AuthUserResponse = {
    id: string;
    fname: string;
    lname: string;
    email: string;
    status: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
};

type WorkspacePlanLabel = 'Free' | 'Pro';

type LastUsedWorkspaceResponse = {
    id: string;
    name: string;
    plan: WorkspacePlanLabel;
    roleId: string | null;
    accessId: string | null;
};

type AuthPageModel = {
    valid: boolean;
    title: string;
    subtitle: string;
    submitEndpoint: string;
    successRedirectUrl?: string;
    token?: string;
    invalidReason?: string;
};

type GoogleTokenResponse = { access_token?: string };

type GoogleProfileResponse = {
    email?: string;
    email_verified?: boolean;
    given_name?: string;
    family_name?: string;
    name?: string;
};

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authRepository: AuthRepository,
        private readonly emailsService: EmailsService,
        private readonly r2: R2Service,
        @Inject(appConfig.auth.basicJWT.name) private readonly jwtService: JwtService
    ) {}

    getGoogleAuthorizationUrl(): string {
        this.assertGoogleAuthEnabled();

        const params = new URLSearchParams({
            client_id: appConfig.auth.google.clientId,
            redirect_uri: appConfig.auth.google.redirectUri,
            response_type: 'code',
            scope: appConfig.auth.google.scopes.join(' '),
            access_type: 'online',
            include_granted_scopes: 'true',
            prompt: 'select_account'
        });

        return `${appConfig.auth.google.authorizationUrl}?${params.toString()}`;
    }

    getGoogleSuccessRedirectUrl(): string {
        return this.buildClientRedirectUrl(appConfig.auth.google.successRedirectPath);
    }

    getGoogleFailureRedirectUrl(): string {
        return this.buildClientRedirectUrl(appConfig.auth.google.failureRedirectPath);
    }

    async loginWithGoogleCode(code: string) {
        this.assertGoogleAuthEnabled();

        const trimmedCode = code.trim();
        if (!trimmedCode) {
            throw new BadRequestException('Missing Google authorization code');
        }

        const accessToken = await this.exchangeGoogleCodeForAccessToken(trimmedCode);
        const profile = await this.fetchGoogleProfile(accessToken);

        const email = profile.email?.toLowerCase().trim();
        if (!email) {
            throw new UnauthorizedException('Google account email is unavailable');
        }

        if (profile.email_verified === false) {
            throw new UnauthorizedException('Google account email is not verified');
        }

        const names = this.resolveGoogleNames(profile);

        let user = await this.authRepository.findUserByEmail({ email });

        if (!user) {
            user = await this.authRepository.createUser({
                fname: names.fname,
                lname: names.lname,
                email,
                status: UserStatus.ACTIVE
            });
        } else {
            const fname = user.fname?.trim() || names.fname;
            const lname = user.lname?.trim() || names.lname;

            if (user.fname !== fname || user.lname !== lname) {
                user = await this.authRepository.updateUserProfile({ id: user.id, fname, lname });
            }

            if (user.status !== UserStatus.ACTIVE) {
                user = await this.authRepository.updateUserStatus({ id: user.id, status: UserStatus.ACTIVE });
            }
        }

        const token = await this.jwtService.signAsync(this.buildTokenData(user.id));
        const lastUsedWorkspace = await this.resolveLastUsedWorkspace(undefined, user);

        return { token, user: this.mapUser(user), lastUsedWorkspace };
    }

    async getMe(tokenData?: TokenData) {
        if (!tokenData?.sub?.trim()) {
            throw new UnauthorizedException('Unauthorized');
        }

        const user = await this.authRepository.findUserById({ id: tokenData.sub });
        if (!user) {
            throw new UnauthorizedException('Unauthorized');
        }

        const lastUsedWorkspace = await this.resolveLastUsedWorkspace(tokenData, user);

        return { user: this.mapUser(user), lastUsedWorkspace };
    }

    async signup(payload: SignupPayload) {
        const existingUser = await this.authRepository.findUserByEmail({ email: payload.email });

        if (existingUser) {
            throw new ConflictException('An account already exists with this email address');
        }

        const user = await this.authRepository.createUser({
            fname: payload.fname,
            lname: payload.lname,
            email: payload.email,
            status: UserStatus.PENDING
        });

        const rawToken = await this.createAuthToken(user.id, AuthTokenType.ACCOUNT_SETUP, ACCOUNT_SETUP_TTL_MS);
        const resetLink = this.buildResetLink(rawToken);

        await this.sendAuthEmail({
            to: user.email,
            type: EMAIL_TYPES.ACCOUNT_SETUP,
            subject: 'Set your account password',
            context: { name: user.fname, resetLink, expiresIn: '24 hours' }
        });

        return { message: 'Account created successfully. We sent a password setup link to your email.' };
    }

    async login(payload: LoginPayload) {
        const email = payload.email.toLowerCase().trim();

        const user = await this.authRepository.findUserByEmail({ email });
        if (!user?.passwordHash) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await this.verifyPassword(payload.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const token = await this.jwtService.signAsync(this.buildTokenData(user.id));
        const lastUsedWorkspace = await this.resolveLastUsedWorkspace(undefined, user);

        return { token, user: this.mapUser(user), lastUsedWorkspace };
    }

    async forgetPassword(payload: ForgetPasswordPayload) {
        const email = payload.email.toLowerCase().trim();
        const user = await this.authRepository.findUserByEmail({ email });

        if (!user) {
            return { message: FORGET_PASSWORD_RESPONSE };
        }

        const tokenType = user.passwordHash ? AuthTokenType.PASSWORD_RESET : AuthTokenType.ACCOUNT_SETUP;
        const ttlMs = tokenType === AuthTokenType.PASSWORD_RESET ? PASSWORD_RESET_TTL_MS : ACCOUNT_SETUP_TTL_MS;
        const rawToken = await this.createAuthToken(user.id, tokenType, ttlMs);
        const resetLink = this.buildResetLink(rawToken);

        await this.sendAuthEmail({
            to: user.email,
            type: tokenType === AuthTokenType.PASSWORD_RESET ? EMAIL_TYPES.PASSWORD_RESET : EMAIL_TYPES.ACCOUNT_SETUP,
            subject: tokenType === AuthTokenType.PASSWORD_RESET ? 'Reset your password' : 'Set your account password',
            context: {
                name: user.fname,
                resetLink,
                expiresIn: tokenType === AuthTokenType.PASSWORD_RESET ? '30 minutes' : '24 hours'
            }
        });

        return { message: FORGET_PASSWORD_RESPONSE };
    }

    async getResetPasswordPage(token: string): Promise<AuthPageModel> {
        const normalizedToken = token.trim();

        if (!normalizedToken) {
            return {
                valid: false,
                title: 'Reset link missing',
                subtitle: 'The reset link is incomplete.',
                submitEndpoint: this.buildVersionedApiPath('auth/reset-password'),
                invalidReason: 'Please open the full reset link from your email and try again.'
            };
        }

        const authToken = await this.findValidAuthToken(normalizedToken);

        if (!authToken) {
            return {
                valid: false,
                title: 'Reset link invalid',
                subtitle: 'Your link is invalid, already used, or expired.',
                submitEndpoint: this.buildVersionedApiPath('auth/reset-password'),
                invalidReason: 'Please request a new password link and try again.'
            };
        }

        const isSetupFlow = authToken.type === AuthTokenType.ACCOUNT_SETUP;

        return {
            valid: true,
            title: isSetupFlow ? 'Create your password' : 'Reset your password',
            subtitle: isSetupFlow
                ? 'Set a strong password to activate your account.'
                : 'Enter a new password for your account.',
            submitEndpoint: this.buildVersionedApiPath('auth/reset-password'),
            successRedirectUrl: this.buildClientRedirectUrl('/'),
            token: normalizedToken
        };
    }

    async resetPassword(payload: ResetPasswordPayload) {
        const tokenHash = this.hashToken(payload.token);
        const now = new Date();
        const passwordHash = await this.hashPassword(payload.password);

        const userId = await this.prisma.$transaction(async tx => {
            const authToken = await this.authRepository.findAuthTokenByHash({ tokenHash }, tx);

            if (!authToken || authToken.usedAt || authToken.expiresAt <= now) {
                throw new BadRequestException('Password link is invalid or expired');
            }

            const consumed = await this.authRepository.consumeAuthToken({ id: authToken.id, usedAt: now }, tx);

            if (consumed.count !== 1) {
                throw new BadRequestException('Password link is invalid or expired');
            }

            await this.authRepository.updateUserPassword(
                { id: authToken.userId, passwordHash, status: UserStatus.ACTIVE },
                tx
            );

            await this.authRepository.markAllUserAuthTokensUsed({ userId: authToken.userId, usedAt: now }, tx);

            return authToken.userId;
        });

        const user = await this.authRepository.findUserById({ id: userId });
        if (!user) {
            throw new BadRequestException('Unable to locate user for password reset');
        }

        const token = await this.jwtService.signAsync(this.buildTokenData(user.id));
        const lastUsedWorkspace = await this.resolveLastUsedWorkspace(undefined, user);
        const redirectUrl = this.buildClientRedirectUrl('/');

        return {
            message: 'Password updated successfully',
            token,
            user: this.mapUser(user),
            lastUsedWorkspace,
            redirectUrl
        };
    }

    attachAuthCookie(reply: FastifyReply, token: string): void {
        const cookieName = this.getAuthCookieName();
        const maxAge = Number(appConfig.auth.basicJWT.expiresIn);

        reply.setCookie(cookieName, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: appConfig.server.mode === 'production',
            path: '/',
            maxAge
        });
    }

    clearAuthCookie(reply: FastifyReply): void {
        const cookieName = this.getAuthCookieName();

        reply.clearCookie(cookieName, { sameSite: 'lax', secure: appConfig.server.mode === 'production', path: '/' });
    }

    async updateProfile(user: TokenData, payload: UpdateProfilePayload) {
        const userId = user.sub;
        const dbUser = await this.authRepository.findUserById({ id: userId });
        if (!dbUser) {
            throw new BadRequestException('User not found');
        }

        const updatedUser = await this.authRepository.updateUserProfile({
            id: userId,
            fname: payload.fname,
            lname: payload.lname
        });

        return this.mapUser(updatedUser);
    }

    async uploadProfileImage(user: TokenData, payload: UploadProfileImagePayload) {
        const userId = user.sub;
        const { profileImage } = payload;
        if (!profileImage || profileImage.length === 0) {
            throw new BadRequestException('Profile image file is required');
        }
        const profileImageFile = profileImage[0];

        const dbUser = await this.authRepository.findUserById({ id: userId });
        if (!dbUser) {
            throw new BadRequestException('User not found');
        }

        const fileBuffer = await fs.readFile(profileImageFile.filePath);
        const key = `users/${userId}/profile`;
        await this.r2.uploadFile(key, fileBuffer, profileImageFile.mimetype);

        await this.authRepository.updateUserProfileImage({ id: userId, profileMime: profileImageFile.mimetype });

        return { message: 'Profile image uploaded successfully' };
    }

    async getProfileImage(userId: string) {
        const dbUser = await this.authRepository.findUserById({ id: userId });
        if (!dbUser?.profileMime) {
            throw new NotFoundException('Profile image not found');
        }

        const key = `users/${userId}/profile`;
        try {
            const result = await this.r2.downloadFile(key);
            return { stream: result.Body, contentType: result.ContentType || 'image/png' };
        } catch (_error) {
            throw new NotFoundException('Profile image not found');
        }
    }

    private mapUser(user: User): AuthUserResponse {
        return {
            id: user.id,
            fname: user.fname,
            lname: user.lname,
            email: user.email,
            status: user.status,
            avatarUrl: user.profileMime ? `${appConfig.backend.url}/api/v1/auth/profile-image/${user.id}` : null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    private async resolveLastUsedWorkspace(
        tokenData: TokenData | undefined,
        user: Pick<User, 'id' | 'lastUsedWorkspaceId'>
    ): Promise<LastUsedWorkspaceResponse | null> {
        const userId = user.id;
        const tokenWorkspaceId = tokenData?.workspaceId?.trim();

        if (tokenWorkspaceId) {
            const tokenMembership = await this.authRepository.findWorkspaceMembershipByUserAndWorkspace({
                userId,
                workspaceId: tokenWorkspaceId
            });

            if (tokenMembership) {
                if (user.lastUsedWorkspaceId !== tokenMembership.workspace.id) {
                    await this.authRepository.updateUserLastUsedWorkspace({
                        id: userId,
                        lastUsedWorkspaceId: tokenMembership.workspace.id
                    });
                }

                return {
                    id: tokenMembership.workspace.id,
                    name: tokenMembership.workspace.name,
                    plan: this.mapWorkspacePlan(tokenMembership.workspace.plan),
                    roleId: tokenData?.roleId?.trim() || tokenMembership.role,
                    accessId: tokenData?.accessId?.trim() || null
                };
            }
        }

        const persistedWorkspaceId = user.lastUsedWorkspaceId?.trim();

        if (persistedWorkspaceId) {
            const persistedMembership = await this.authRepository.findWorkspaceMembershipByUserAndWorkspace({
                userId,
                workspaceId: persistedWorkspaceId
            });

            if (persistedMembership) {
                return {
                    id: persistedMembership.workspace.id,
                    name: persistedMembership.workspace.name,
                    plan: this.mapWorkspacePlan(persistedMembership.workspace.plan),
                    roleId: persistedMembership.role,
                    accessId: null
                };
            }

            await this.authRepository.updateUserLastUsedWorkspace({ id: userId, lastUsedWorkspaceId: null });
        }

        const membership = await this.authRepository.findMostRecentWorkspaceMembershipByUser({ userId });

        if (!membership) {
            return null;
        }

        await this.authRepository.updateUserLastUsedWorkspace({
            id: userId,
            lastUsedWorkspaceId: membership.workspace.id
        });

        return {
            id: membership.workspace.id,
            name: membership.workspace.name,
            plan: this.mapWorkspacePlan(membership.workspace.plan),
            roleId: membership.role,
            accessId: null
        };
    }

    private mapWorkspacePlan(plan: WorkspacePlan): WorkspacePlanLabel {
        switch (plan) {
            case WorkspacePlan.PRO:
                return 'Pro';
            default:
                return 'Free';
        }
    }

    private buildTokenData(userId: string): TokenData {
        return { sub: userId, workspaceId: '', roleId: '', accessId: '' };
    }

    private buildVersionedApiPath(path: string): string {
        const routePrefix = appConfig.server.routePrefix.replace(/^\/+|\/+$/g, '');
        const version = String(appConfig.server.version).trim();
        const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
        const normalizedPath = path.replace(/^\/+/, '');
        const segments = [routePrefix, normalizedVersion, normalizedPath].filter(Boolean);

        return `/${segments.join('/')}`;
    }

    private buildResetLink(token: string): string {
        const baseUrl = appConfig.backend.url.replace(/\/+$/, '');
        const path = this.buildVersionedApiPath('auth/reset-password');
        return `${baseUrl}${path}?token=${encodeURIComponent(token)}`;
    }

    private getAuthCookieName(): string {
        return appConfig.auth.tokenCookieNames[0] ?? 'handit_auth_token';
    }

    private buildClientRedirectUrl(path: string): string {
        const clientUrl = appConfig.client.url.replace(/\/+$/, '');
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `${clientUrl}${normalizedPath}`;
    }

    private assertGoogleAuthEnabled(): void {
        if (!appConfig.auth.google.enabled) {
            throw new BadRequestException('Google sign-in is disabled');
        }
    }

    private resolveGoogleNames(profile: GoogleProfileResponse): { fname: string; lname: string } {
        const givenName = profile.given_name?.trim();
        const familyName = profile.family_name?.trim();

        if (givenName && familyName) {
            return { fname: givenName, lname: familyName };
        }

        const fullName = profile.name?.trim();
        if (fullName) {
            const parts = fullName.split(/\s+/);
            const first = parts.shift() || 'Google';
            const last = parts.join(' ') || familyName || 'User';
            return { fname: first, lname: last };
        }

        return { fname: givenName || 'Google', lname: familyName || 'User' };
    }

    private async exchangeGoogleCodeForAccessToken(code: string): Promise<string> {
        const response = await fetch(appConfig.auth.google.tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: appConfig.auth.google.clientId,
                client_secret: appConfig.auth.google.clientSecret,
                redirect_uri: appConfig.auth.google.redirectUri,
                grant_type: 'authorization_code'
            })
        });

        const payload = (await response.json().catch(() => null)) as GoogleTokenResponse | null;

        if (!(response.ok && payload?.access_token)) {
            throw new UnauthorizedException('Unable to authenticate with Google');
        }

        return payload.access_token;
    }

    private async fetchGoogleProfile(accessToken: string): Promise<GoogleProfileResponse> {
        const response = await fetch(appConfig.auth.google.userInfoUrl, {
            method: 'GET',
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const payload = (await response.json().catch(() => null)) as GoogleProfileResponse | null;

        if (!(response.ok && payload)) {
            throw new UnauthorizedException('Unable to fetch Google profile');
        }

        return payload;
    }

    private async sendAuthEmail(params: {
        to: string;
        type: EmailType;
        subject: string;
        context: Record<string, unknown>;
    }): Promise<void> {
        const sent = await this.emailsService.sendTemplate(params.to, params.subject, params.type, params.context);

        if (appConfig.email?.enabled && !sent) {
            throw new InternalServerErrorException('Unable to send auth email at this time');
        }
    }

    private async createAuthToken(userId: string, type: AuthTokenType, ttlMs: number): Promise<string> {
        const token = randomBytes(AUTH_TOKEN_BYTES).toString('hex');
        const tokenHash = this.hashToken(token);
        const expiresAt = new Date(Date.now() + ttlMs);
        const now = new Date();

        await this.prisma.$transaction(async tx => {
            await this.authRepository.markAuthTokensUsedByType({ userId, type, usedAt: now }, tx);

            await this.authRepository.createAuthToken({ userId, type, tokenHash, expiresAt }, tx);
        });

        return token;
    }

    private async findValidAuthToken(rawToken: string) {
        const tokenHash = this.hashToken(rawToken);
        const authToken = await this.authRepository.findAuthTokenByHash({ tokenHash });

        if (!authToken) {
            return null;
        }

        if (authToken.usedAt) {
            return null;
        }

        if (authToken.expiresAt <= new Date()) {
            return null;
        }

        return authToken;
    }

    private hashToken(rawToken: string): string {
        return createHash('sha256').update(rawToken).digest('hex');
    }

    async hashPassword(password: string): Promise<string> {
        const salt = randomBytes(PASSWORD_HASH_SALT_BYTES).toString('hex');
        const keyBuffer = (await scryptAsync(password, salt, PASSWORD_HASH_KEY_LENGTH)) as Buffer;
        return `${salt}:${keyBuffer.toString('hex')}`;
    }

    async verifyPassword(password: string, hash: string): Promise<boolean> {
        const [salt, key] = hash.split(':');

        if (!(salt && key)) {
            return false;
        }

        const providedKeyBuffer = (await scryptAsync(password, salt, PASSWORD_HASH_KEY_LENGTH)) as Buffer;
        const storedKeyBuffer = Buffer.from(key, 'hex');

        if (storedKeyBuffer.length !== providedKeyBuffer.length) {
            return false;
        }

        return timingSafeEqual(storedKeyBuffer, providedKeyBuffer);
    }
}
