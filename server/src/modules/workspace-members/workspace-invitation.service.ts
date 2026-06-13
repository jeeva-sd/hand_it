import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Inject,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus, WorkspaceMemberStatus, WorkspacePlan, WorkspaceRole } from '@prisma/client';
import { EmailsService, PrismaService } from '~/integrations';
import { EMAIL_TYPES } from '~/integrations/email/email.constants';
import { appConfig } from '~/system/config';
import { AuthRepository } from '../auth/auth.repository';
import { AuthService } from '../auth/auth.service';
import { WorkspaceCacheService } from '../workspaces/workspace-cache.service';
import { WorkspaceMembersCacheService } from './workspace-members-cache.service';
import { WorkspaceMembersRepository } from './workspace-members.repository';

const INVITE_TOKEN_EXPIRY = '7d';

type InviteTokenPayload = {
    sub: string; // memberId
    userId: string;
    workspaceId: string;
    type: 'workspace_invite';
};

type InviteMemberParams = {
    workspaceId: string;
    email: string;
    role: WorkspaceRole;
    inviterName: string;
    workspaceName: string;
};

type InvitePageData = {
    valid: boolean;
    expired?: boolean;
    workspaceName?: string;
    isNewUser?: boolean;
    token?: string;
    errorMessage?: string;
    acceptEndpoint?: string;
    declineEndpoint?: string;
};

@Injectable()
export class WorkspaceInvitationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly repository: WorkspaceMembersRepository,
        private readonly authRepository: AuthRepository,
        private readonly authService: AuthService,
        private readonly emailsService: EmailsService,
        private readonly cache: WorkspaceMembersCacheService,
        private readonly workspaceCache: WorkspaceCacheService,
        @Inject(appConfig.auth.basicJWT.name) private readonly jwtService: JwtService
    ) {}

    async inviteMember(params: InviteMemberParams) {
        const { workspaceId, email, role, inviterName, workspaceName } = params;

        // Prevent inviting as OWNER
        if (role === WorkspaceRole.OWNER) {
            throw new ForbiddenException('Cannot invite a user as an owner');
        }

        return this.prisma.$transaction(async tx => {
            // Check if user already exists
            let user = await this.repository.findUserByEmail(email, tx);
            let isNewUser = false;

            if (!user) {
                // Create a new PENDING user without a personal workspace
                user = await this.authRepository.createUser(
                    { fname: '', lname: '', email, status: UserStatus.PENDING },
                    tx,
                    { skipWorkspace: true }
                );
                isNewUser = true;
            }

            // Check if a membership already exists for this workspace
            const existingMember = await this.repository.findMemberByWorkspaceAndUser(workspaceId, user.id, tx);

            if (existingMember) {
                if (existingMember.status === WorkspaceMemberStatus.ACTIVE) {
                    throw new ConflictException('This user is already an active member of the workspace');
                }
                if (existingMember.status === WorkspaceMemberStatus.INVITED) {
                    throw new ConflictException('This user has already been invited to the workspace');
                }
            }

            // Create or re-create member with INVITED status
            let member;
            if (existingMember) {
                // Re-invite a previously declined/deleted member
                member = await this.prisma.workspaceMember.update({
                    where: { id: existingMember.id },
                    data: { role, status: WorkspaceMemberStatus.INVITED },
                    select: { id: true, role: true, status: true }
                });
            } else {
                member = await this.repository.createMember(workspaceId, user.id, role, tx);
            }

            // Generate invitation JWT
            const inviteToken = await this.generateInviteToken(member.id, user.id, workspaceId);

            // Build invite link
            const inviteLink = this.buildInviteLink(inviteToken);

            // Send invitation email
            await this.emailsService.sendTemplate(
                email,
                `Invitation to join ${workspaceName}`,
                EMAIL_TYPES.WORKSPACE_INVITE,
                { workspaceName, inviterName, inviteLink, isNewUser }
            );

            this.cache.invalidateList(workspaceId);

            return { message: `Invitation sent to ${email}` };
        });
    }

    async getInvitePageData(token: string): Promise<InvitePageData> {
        const payload = this.verifyInviteToken(token);

        if (!payload) {
            return { valid: false, expired: true, errorMessage: 'This invitation has expired or is invalid.' };
        }

        const member = await this.prisma.workspaceMember.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                status: true,
                workspace: { select: { name: true } },
                user: { select: { id: true, status: true } }
            }
        });

        if (!member) {
            return { valid: false, errorMessage: 'This invitation is no longer valid.' };
        }

        if (member.status !== WorkspaceMemberStatus.INVITED) {
            return { valid: false, errorMessage: 'This invitation has already been responded to.' };
        }

        const routePrefix = appConfig.server.routePrefix.replace(/^\/+|\/+$/g, '');
        const version = String(appConfig.server.version).trim();
        const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
        
        const acceptPath = `/${[routePrefix, normalizedVersion, 'invite', 'accept'].filter(Boolean).join('/')}`;
        const declinePath = `/${[routePrefix, normalizedVersion, 'invite', 'decline'].filter(Boolean).join('/')}`;

        return {
            valid: true,
            workspaceName: member.workspace.name,
            isNewUser: member.user.status === UserStatus.PENDING,
            token,
            acceptEndpoint: acceptPath,
            declineEndpoint: declinePath
        };
    }

    async acceptInvitation(token: string, password?: string, confirmPassword?: string) {
        const payload = this.verifyInviteToken(token);

        if (!payload) {
            throw new BadRequestException('Invitation link is invalid or expired');
        }

        const member = await this.prisma.workspaceMember.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                status: true,
                workspaceId: true,
                user: { select: { id: true, fname: true, lname: true, status: true, passwordHash: true } }
            }
        });

        if (!member || member.status !== WorkspaceMemberStatus.INVITED) {
            throw new BadRequestException('This invitation is no longer valid');
        }

        const user = member.user;
        const isNewUser = user.status === UserStatus.PENDING;

        if (isNewUser) {
            // Validate password fields
            if (!password || !confirmPassword) {
                throw new BadRequestException('Password and confirm password are required');
            }

            if (password !== confirmPassword) {
                throw new BadRequestException('Passwords do not match');
            }

            const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,128}$/;
            if (!passwordRegex.test(password)) {
                throw new BadRequestException(
                    'Password must be 8-128 characters with at least one uppercase, one lowercase, and one number'
                );
            }

            const passwordHash = await this.authService.hashPassword(password);

            // Everything in one transaction: activate user, create personal workspace, update member
            await this.prisma.$transaction(async tx => {
                // Activate user and set password
                await this.authRepository.updateUserPassword(
                    { id: user.id, passwordHash, status: UserStatus.ACTIVE },
                    tx
                );

                // Create personal workspace
                const personalWorkspaceName = 'My Workspace';
                await this.authRepository.createPersonalWorkspace(user.id, personalWorkspaceName, tx);

                // Update member status to ACTIVE
                await this.repository.updateStatus(member.id, WorkspaceMemberStatus.ACTIVE, tx);

                // Set last used workspace to the invited workspace
                await this.authRepository.updateUserLastUsedWorkspace(
                    { id: user.id, lastUsedWorkspaceId: member.workspaceId },
                    tx
                );
            });
        } else {
            // Existing active user — just activate membership
            await this.repository.updateStatus(member.id, WorkspaceMemberStatus.ACTIVE);

            // Update last used workspace to the invited workspace
            await this.authRepository.updateUserLastUsedWorkspace({
                id: user.id,
                lastUsedWorkspaceId: member.workspaceId
            });
        }

        // Invalidate caches
        this.cache.invalidateList(member.workspaceId);
        this.workspaceCache.invalidateRole(member.workspaceId, user.id);
        this.workspaceCache.invalidateLists([user.id]);
        this.workspaceCache.invalidateDetail(member.workspaceId);

        // Generate auth JWT for the user
        const authToken = await this.jwtService.signAsync({ sub: user.id, workspaceId: '', roleId: '', accessId: '' });
        const redirectUrl = this.buildClientRedirectUrl('/');

        return { token: authToken, redirectUrl };
    }

    async declineInvitation(token: string) {
        const payload = this.verifyInviteToken(token);

        if (!payload) {
            throw new BadRequestException('Invitation link is invalid or expired');
        }

        const member = await this.prisma.workspaceMember.findUnique({
            where: { id: payload.sub },
            select: { id: true, status: true, workspaceId: true, userId: true }
        });

        if (!member || member.status !== WorkspaceMemberStatus.INVITED) {
            throw new BadRequestException('This invitation is no longer valid');
        }

        await this.repository.updateStatus(member.id, WorkspaceMemberStatus.DECLINED);

        this.cache.invalidateList(member.workspaceId);

        return { message: 'Invitation declined' };
    }

    private async generateInviteToken(memberId: string, userId: string, workspaceId: string): Promise<string> {
        const payload: InviteTokenPayload = {
            sub: memberId,
            userId,
            workspaceId,
            type: 'workspace_invite'
        };

        return this.jwtService.signAsync(payload, { expiresIn: INVITE_TOKEN_EXPIRY });
    }

    private verifyInviteToken(token: string): InviteTokenPayload | null {
        try {
            const payload = this.jwtService.verify<InviteTokenPayload>(token);

            if (payload.type !== 'workspace_invite') {
                return null;
            }

            return payload;
        } catch {
            return null;
        }
    }

    private buildInviteLink(token: string): string {
        const baseUrl = appConfig.backend.url.replace(/\/+$/, '');
        const routePrefix = appConfig.server.routePrefix.replace(/^\/+|\/+$/g, '');
        const version = String(appConfig.server.version).trim();
        const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
        const segments = [routePrefix, normalizedVersion, 'invite'].filter(Boolean);
        const path = `/${segments.join('/')}`;

        return `${baseUrl}${path}?token=${encodeURIComponent(token)}`;
    }

    private buildClientRedirectUrl(path: string): string {
        const clientUrl = appConfig.client.url.replace(/\/+$/, '');
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `${clientUrl}${normalizedPath}`;
    }
}
