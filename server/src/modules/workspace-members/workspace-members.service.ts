import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import { WorkspaceMemberStatus, WorkspacePlan, WorkspaceRole } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { Store } from '~/shared/types/store.type';
import { WorkspaceSummary } from '../workspaces/workspace.service';
import { WorkspaceCacheService } from '../workspaces/workspace-cache.service';
import {
    InviteMemberInputType,
    ListMembersInputType,
    MemberPathInputType,
    UpdateMemberInputType,
    WorkspaceMemberPathInputType
} from './schemas';
import { WorkspaceInvitationService } from './workspace-invitation.service';
import { WorkspaceMembersRepository } from './workspace-members.repository';
import { WorkspaceMembersCacheService } from './workspace-members-cache.service';

@Injectable()
export class WorkspaceMembersService {
    constructor(
        private readonly repository: WorkspaceMembersRepository,
        private readonly cache: WorkspaceMembersCacheService,
        private readonly workspaceCache: WorkspaceCacheService,
        private readonly invitationService: WorkspaceInvitationService,
        private readonly cls: ClsService<Store>
    ) {}

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
        await this.assertProWorkspace(workspaceId);
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

    async inviteMember(payload: InviteMemberInputType) {
        const currentUserId = this.userId;
        const workspaceId = payload.workspaceId;
        await this.assertProWorkspace(workspaceId);

        // Try getting workspace name from cache first
        let workspaceName: string;
        const cachedWorkspace = this.workspaceCache.getDetail<WorkspaceSummary>(workspaceId);
        if (cachedWorkspace) {
            workspaceName = cachedWorkspace.name;
        } else {
            const dbWorkspace = await this.repository.findWorkspaceById(workspaceId);
            if (!dbWorkspace) {
                throw new NotFoundException('Workspace not found');
            }
            workspaceName = dbWorkspace.name;
        }

        // Try getting inviter info from request CLS cache first
        let inviter = this.cls.get('user') as { id: string; fname: string } | undefined;
        if (!inviter) {
            const dbInviter = await this.repository.findUserById(currentUserId);
            if (!dbInviter) {
                throw new UnauthorizedException('Unauthorized');
            }
            inviter = dbInviter;
            this.cls.set('user', inviter);
        }

        await this.invitationService.inviteMember({
            workspaceId,
            workspaceName,
            email: payload.email,
            role: payload.role,
            inviterName: inviter.fname
        });

        this.cache.invalidateList(workspaceId);
        this.workspaceCache.invalidateDetail(workspaceId);

        return { message: 'Invitation sent successfully' };
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
        this.workspaceCache.invalidateRole(workspaceId, member.userId);

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

        if (member.userId === currentUserId) {
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
        this.workspaceCache.invalidateRole(workspaceId, member.userId);
        this.workspaceCache.invalidateLists([member.userId]);
        this.workspaceCache.invalidateDetail(workspaceId);

        return { message: 'Member removed successfully' };
    }

    async acceptInvite(payload: WorkspaceMemberPathInputType) {
        const userId = this.userId;
        const workspaceId = payload.workspaceId;

        const member = await this.repository.findMemberByWorkspaceAndUser(workspaceId, userId);
        if (!member || member.status !== WorkspaceMemberStatus.INVITED) {
            throw new NotFoundException('Invitation not found');
        }

        await this.repository.updateStatus(member.id, WorkspaceMemberStatus.ACTIVE);

        this.cache.invalidateList(workspaceId);
        this.workspaceCache.invalidateRole(workspaceId, userId);
        this.workspaceCache.invalidateLists([userId]);
        this.workspaceCache.invalidateDetail(workspaceId);

        return { message: 'Invitation accepted successfully' };
    }

    async declineInvite(payload: WorkspaceMemberPathInputType) {
        const userId = this.userId;
        const workspaceId = payload.workspaceId;

        const member = await this.repository.findMemberByWorkspaceAndUser(workspaceId, userId);
        if (!member || member.status !== WorkspaceMemberStatus.INVITED) {
            throw new NotFoundException('Invitation not found');
        }

        await this.repository.updateStatus(member.id, WorkspaceMemberStatus.DECLINED);

        this.cache.invalidateList(workspaceId);
        this.workspaceCache.invalidateRole(workspaceId, userId);
        this.workspaceCache.invalidateLists([userId]);
        this.workspaceCache.invalidateDetail(workspaceId);

        return { message: 'Invitation declined successfully' };
    }
}
