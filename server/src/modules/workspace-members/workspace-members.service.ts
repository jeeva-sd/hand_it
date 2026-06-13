import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import { WorkspaceMemberStatus, WorkspacePlan, WorkspaceRole } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { PrismaService } from '~/integrations';
import { Store } from '~/shared/types/store.type';
import { WorkspaceSummary } from '../workspaces/workspace.service';
import { WorkspaceCacheService } from '../workspaces/workspace-cache.service';
import {
    ListMembersInputType,
    MemberPathInputType,
    UpdateMemberInputType
} from './schemas';
import { WorkspaceMembersRepository } from './workspace-members.repository';
import { WorkspaceMembersCacheService } from './workspace-members-cache.service';
import { WorkspaceInvitationService } from './workspace-invitation.service';

@Injectable()
export class WorkspaceMembersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly repository: WorkspaceMembersRepository,
        private readonly cache: WorkspaceMembersCacheService,
        private readonly workspaceCache: WorkspaceCacheService,
        private readonly cls: ClsService<Store>,
        private readonly invitationService: WorkspaceInvitationService
    ) { }

    async inviteMember(payload: any) {
        const { workspaceId, email, role } = payload;
        await this.assertProWorkspace(workspaceId);

        // Fetch workspace name
        const dbWorkspace = await this.repository.findWorkspaceById(workspaceId);
        if (!dbWorkspace) {
            throw new NotFoundException('Workspace not found');
        }

        // Fetch inviter user profile/name
        const inviterId = this.userId;
        const inviter = await this.prisma.user.findUnique({
            where: { id: inviterId },
            select: { fname: true, lname: true }
        });
        const inviterName = inviter ? `${inviter.fname} ${inviter.lname}`.trim() : 'Someone';

        return this.invitationService.inviteMember({
            workspaceId,
            email,
            role,
            inviterName,
            workspaceName: dbWorkspace.name
        });
    }

    private get userId(): string {
        const userId = this.cls.get('userId');
        if (!userId) {
            throw new UnauthorizedException('Unauthorized');
        }
        return userId;
    }

    private async assertProWorkspace(workspaceId: string): Promise<void> {
        const cachedWorkspace = this.workspaceCache.getDetail<WorkspaceSummary>(workspaceId);
        let plan: string;
        if (cachedWorkspace) {
            plan = cachedWorkspace.plan;
        } else {
            const dbWorkspace = await this.repository.findWorkspaceById(workspaceId);
            if (!dbWorkspace) {
                throw new NotFoundException('Workspace not found');
            }
            plan = dbWorkspace.plan;
        }

        if (plan !== WorkspacePlan.PRO) {
            throw new ForbiddenException('Member operations are only allowed in Pro workspaces');
        }
    }

    async listMembers(payload: ListMembersInputType) {
        const workspaceId = payload.workspaceId;
        const cached = this.cache.getList(workspaceId, payload);
        if (cached) {
            return cached;
        }

        const [members, total] = await Promise.all([
            this.repository.findMembers(
                workspaceId,
                payload.searchTerm,
                payload.sortBy,
                payload.sortOrder,
                (payload.page - 1) * payload.size,
                payload.size
            ),
            this.repository.countMembers(workspaceId, payload.searchTerm)
        ]);

        const result = { total, members };
        this.cache.setList(workspaceId, payload, result);

        return result;
    }

    async updateMemberRole(payload: UpdateMemberInputType) {
        const { workspaceId, memberId, role } = payload;
        await this.assertProWorkspace(workspaceId);
        const member = await this.repository.findMemberById(workspaceId, memberId);
        if (!member) {
            throw new NotFoundException('Member not found in this workspace');
        }

        // Enforce ownership checks: Never allow demoting the last active owner
        if (member.role === WorkspaceRole.OWNER && role !== WorkspaceRole.OWNER) {
            const activeOwnersCount = await this.repository.countActiveOwners(workspaceId);
            if (activeOwnersCount <= 1) {
                throw new ConflictException('Cannot demote the last owner of the workspace');
            }
        }

        const updated = await this.repository.updateRole(memberId, role);

        this.cache.invalidateList(workspaceId);
        this.workspaceCache.invalidateRole(workspaceId, member.user.id);

        return updated;
    }

    async removeMember(payload: MemberPathInputType) {
        const currentUserId = this.userId;
        const { workspaceId, memberId } = payload;
        await this.assertProWorkspace(workspaceId);
        const member = await this.repository.findMemberById(workspaceId, memberId);

        if (!member) {
            throw new NotFoundException('Member not found in this workspace');
        }

        if (member.user.id === currentUserId) {
            throw new ConflictException('You cannot remove yourself from the workspace');
        }

        // Enforce ownership checks: Never allow removing the last active owner
        if (member.role === WorkspaceRole.OWNER && member.status === WorkspaceMemberStatus.ACTIVE) {
            const activeOwnersCount = await this.repository.countActiveOwners(workspaceId);
            if (activeOwnersCount <= 1) {
                throw new ConflictException('Cannot remove the last owner of the workspace');
            }
        }

        await this.repository.updateStatus(memberId, WorkspaceMemberStatus.DELETED);

        this.cache.invalidateList(workspaceId);
        this.workspaceCache.invalidateRole(workspaceId, member.user.id);
        this.workspaceCache.invalidateLists([member.user.id]);
        this.workspaceCache.invalidateDetail(workspaceId);

        return { message: 'Member removed successfully' };
    }

}

