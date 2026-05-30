import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import {
    BadRequestException,
    ConflictException,
    Inject,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenType, User } from '@prisma/client';
import { FastifyReply } from 'fastify';
import { EmailsService, PrismaService } from '~/integrations';
import { EMAIL_TYPES, EmailType } from '~/integrations/email/email.constants';
import { TokenData } from '~/shared/types/request.type';
import { appConfig } from '~/system/config';
import { AuthRepository } from './auth.repository';
import { ForgetPasswordPayload, LoginPayload, ResetPasswordPayload, SignupPayload } from './schemas';

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
    status: number | null;
    createdAt: Date;
    updatedAt: Date;
};

type AuthPageModel = {
    valid: boolean;
    title: string;
    subtitle: string;
    submitEndpoint: string;
    token?: string;
    invalidReason?: string;
};

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authRepository: AuthRepository,
        private readonly emailsService: EmailsService,
        @Inject(appConfig.auth.basicJWT.name) private readonly jwtService: JwtService
    ) {}

    async signup(payload: SignupPayload) {
        const email = payload.email.toLowerCase().trim();

        const existingUser = await this.authRepository.findUserByEmail({ email });

        if (existingUser?.passwordHash) {
            throw new ConflictException('An account already exists with this email address');
        }

        const user = existingUser
            ? await this.authRepository.updateUserProfile({
                  id: existingUser.id,
                  fname: payload.fname,
                  lname: payload.lname
              })
            : await this.authRepository.createUser({ fname: payload.fname, lname: payload.lname, email, status: 0 });

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

        return { token, user: this.mapUser(user) };
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
        const authToken = await this.findValidAuthToken(token);

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
            token
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

            await this.authRepository.updateUserPassword({ id: authToken.userId, passwordHash, status: 1 }, tx);

            await this.authRepository.markAllUserAuthTokensUsed({ userId: authToken.userId, usedAt: now }, tx);

            return authToken.userId;
        });

        const user = await this.authRepository.findUserById({ id: userId });
        if (!user) {
            throw new BadRequestException('Unable to locate user for password reset');
        }

        const token = await this.jwtService.signAsync(this.buildTokenData(user.id));

        return { message: 'Password updated successfully', token, user: this.mapUser(user) };
    }

    attachAuthCookie(reply: FastifyReply, token: string): void {
        const cookieName = appConfig.auth.tokenCookieNames[0] ?? 'token';
        const maxAge = Number(appConfig.auth.basicJWT.expiresIn);

        reply.setCookie(cookieName, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: appConfig.server.mode === 'production',
            path: '/',
            maxAge
        });
    }

    private mapUser(user: User): AuthUserResponse {
        return {
            id: user.id,
            fname: user.fname,
            lname: user.lname,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
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

    private async hashPassword(password: string): Promise<string> {
        const salt = randomBytes(PASSWORD_HASH_SALT_BYTES).toString('hex');
        const keyBuffer = (await scryptAsync(password, salt, PASSWORD_HASH_KEY_LENGTH)) as Buffer;
        return `${salt}:${keyBuffer.toString('hex')}`;
    }

    private async verifyPassword(password: string, hash: string): Promise<boolean> {
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
