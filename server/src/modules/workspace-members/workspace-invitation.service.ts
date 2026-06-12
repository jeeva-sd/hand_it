import { createHash, randomBytes } from 'node:crypto';
import { ConflictException, Injectable } from '@nestjs/common';
import { AuthTokenType, WorkspaceMemberStatus, WorkspaceRole } from '@prisma/client';
import { EmailsService, PrismaService } from '~/integrations';
import { EMAIL_TYPES } from '~/integrations/email/email.constants';
import { appConfig } from '~/system/config';
import { WorkspaceMembersRepository } from './workspace-members.repository';

const ACCOUNT_SETUP_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

@Injectable()
export class WorkspaceInvitationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly repository: WorkspaceMembersRepository,
        private readonly emailsService: EmailsService
    ) {}

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

    private hashToken(rawToken: string): string {
        return createHash('sha256').update(rawToken).digest('hex');
    }

    async inviteMember(params: {
        workspaceId: string;
        workspaceName: string;
        email: string;
        role: WorkspaceRole;
        inviterName: string;
    }) {
        const { workspaceId, workspaceName, email, role, inviterName } = params;

        let isNewUser = false;
        let setupLink = '';
        const token = randomBytes(32).toString('hex');

        await this.prisma.$transaction(async tx => {
            let user = await this.repository.findUserByEmail(email, tx);

            if (!user) {
                isNewUser = true;
                const fname = email;
                const lname = '';
                const tokenHash = this.hashToken(token);
                const expiresAt = new Date(Date.now() + ACCOUNT_SETUP_TTL_MS);

                user = await this.repository.createUser(fname, lname, email, tx);
                await this.repository.createAuthToken(user.id, tokenHash, AuthTokenType.ACCOUNT_SETUP, expiresAt, tx);
            }

            const existingMember = await this.repository.findMemberByWorkspaceAndUser(workspaceId, user.id, tx);

            if (existingMember) {
                if (
                    existingMember.status === WorkspaceMemberStatus.ACTIVE ||
                    existingMember.status === WorkspaceMemberStatus.INVITED
                ) {
                    throw new ConflictException('User is already a member or has a pending invitation');
                }

                // Re-invite declined or deleted member
                await this.repository.updateRole(existingMember.id, role, tx);
                await this.repository.updateStatus(existingMember.id, WorkspaceMemberStatus.INVITED, tx);
            } else {
                await this.repository.createMember(workspaceId, user.id, role, tx);
            }
        });

        if (isNewUser) {
            setupLink = this.buildResetLink(token);
        }

        // Send email invite AFTER the transaction commits successfully
        const inviteLink = `${appConfig.client.url.replace(/\/+$/, '')}/workspaces/${workspaceId}/invite`;
        await this.emailsService.sendTemplate(
            email,
            `Invitation to join ${workspaceName}`,
            EMAIL_TYPES.WORKSPACE_INVITE,
            { workspaceName, inviterName, inviteLink, isNewUser, setupLink }
        );
    }
}
