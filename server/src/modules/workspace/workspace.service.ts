import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    UnauthorizedException
} from '@nestjs/common';
import { WorkspacePlan, WorkspaceRole } from '@prisma/client';
import { CacheService, PrismaService } from '~/integrations';
import { TokenData } from '~/shared/types/request.type';
import { CreateWorkspacePayload, UpdateWorkspacePayload, WorkspacePathPayload } from './schemas';
import { WorkspaceRepository, WorkspaceWithMemberCount } from './workspace.repository';

const FREE_WORKSPACE_STORAGE_LIMIT_BYTES = BigInt(2 * 1024 * 1024 * 1024);
const WORKSPACE_LIST_CACHE_TTL_SECONDS = 60;
const WORKSPACE_DETAIL_CACHE_TTL_SECONDS = 90;
const EDITABLE_WORKSPACE_ROLES = new Set<WorkspaceRole>([WorkspaceRole.OWNER, WorkspaceRole.ADMIN]);

type WorkspacePlanLabel = 'Free' | 'Pro' | 'Team';

type WorkspaceResponse = {
    id: string;
    name: string;
    plan: WorkspacePlanLabel;
    role: WorkspaceRole;
    memberCount: number;
    storage: { usedBytes: number; limitBytes: number; remainingBytes: number };
    createdAt: Date;
    updatedAt: Date;
};

@Injectable()
export class WorkspaceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workspaceRepository: WorkspaceRepository,
        private readonly cacheService: CacheService
    ) {}

    async listWorkspaces(tokenData?: TokenData) {
        const userId = this.requireUserId(tokenData);
        const cacheKey = this.workspaceListCacheKey(userId);

        const cached = this.cacheService.get<WorkspaceResponse[]>(cacheKey);
        if (cached) {
            return { workspaces: cached };
        }

        const records = await this.workspaceRepository.listWorkspacesByUser({ userId });
        const workspaces = records.map(record => this.mapWorkspace(record.workspace, record.role));

        this.cacheService.set(cacheKey, workspaces, WORKSPACE_LIST_CACHE_TTL_SECONDS);

        return { workspaces };
    }

    async createWorkspace(payload: CreateWorkspacePayload, tokenData?: TokenData) {
        const userId = this.requireUserId(tokenData);

        const createdWorkspace = await this.prisma.$transaction(async tx => {
            const workspace = await this.workspaceRepository.createWorkspace(
                {
                    name: payload.name,
                    createdByUserId: userId,
                    plan: WorkspacePlan.FREE,
                    storageLimitBytes: FREE_WORKSPACE_STORAGE_LIMIT_BYTES
                },
                tx
            );

            await this.workspaceRepository.createWorkspaceMember(
                { workspaceId: workspace.id, userId, role: WorkspaceRole.OWNER },
                tx
            );

            const workspaceForUser = await this.workspaceRepository.findWorkspaceByIdForUser(
                { workspaceId: workspace.id, userId },
                tx
            );

            if (!workspaceForUser) {
                throw new InternalServerErrorException('Unable to load newly created workspace');
            }

            return workspaceForUser;
        });

        const workspace = this.mapWorkspace(createdWorkspace.workspace, createdWorkspace.role);

        this.invalidateWorkspaceListCaches([userId]);
        this.cacheService.set(
            this.workspaceDetailCacheKey(workspace.id, userId),
            workspace,
            WORKSPACE_DETAIL_CACHE_TTL_SECONDS
        );

        return { workspace };
    }

    async getWorkspace(payload: WorkspacePathPayload, tokenData?: TokenData) {
        const userId = this.requireUserId(tokenData);
        const cacheKey = this.workspaceDetailCacheKey(payload.workspaceId, userId);

        const cached = this.cacheService.get<WorkspaceResponse>(cacheKey);
        if (cached) {
            return { workspace: cached };
        }

        const workspaceForUser = await this.workspaceRepository.findWorkspaceByIdForUser({
            workspaceId: payload.workspaceId,
            userId
        });

        if (!workspaceForUser) {
            throw new ForbiddenException('You do not have access to this workspace');
        }

        const workspace = this.mapWorkspace(workspaceForUser.workspace, workspaceForUser.role);
        this.cacheService.set(cacheKey, workspace, WORKSPACE_DETAIL_CACHE_TTL_SECONDS);

        return { workspace };
    }

    async updateWorkspace(payload: UpdateWorkspacePayload, tokenData?: TokenData) {
        const userId = this.requireUserId(tokenData);
        const workspaceId = payload.workspaceId;
        const name = payload.name?.trim();

        if (!name) {
            throw new BadRequestException('Workspace name is required');
        }

        const membership = await this.workspaceRepository.findWorkspaceMembership({ workspaceId, userId });

        if (!membership) {
            throw new ForbiddenException('You do not have access to this workspace');
        }

        if (!EDITABLE_WORKSPACE_ROLES.has(membership.role)) {
            throw new ForbiddenException('Only workspace owners or admins can update this workspace');
        }

        const { workspace: updatedWorkspace, memberUserIds } = await this.prisma.$transaction(async tx => {
            const workspace = await this.workspaceRepository.updateWorkspace({ workspaceId, name }, tx);
            const members = await this.workspaceRepository.findWorkspaceMemberUserIds({ workspaceId }, tx);

            return { workspace, memberUserIds: members.map(member => member.userId) };
        });

        const workspace = this.mapWorkspace(updatedWorkspace, membership.role);

        this.cacheService.delByPrefix(this.workspaceDetailCachePrefix(workspaceId));
        this.invalidateWorkspaceListCaches(memberUserIds);
        this.cacheService.set(
            this.workspaceDetailCacheKey(workspaceId, userId),
            workspace,
            WORKSPACE_DETAIL_CACHE_TTL_SECONDS
        );

        return { workspace };
    }

    private mapWorkspace(workspace: WorkspaceWithMemberCount, role: WorkspaceRole): WorkspaceResponse {
        const usedBytes = Number(workspace.storageUsedBytes);
        const limitBytes = Number(workspace.storageLimitBytes);

        return {
            id: workspace.id,
            name: workspace.name,
            plan: this.mapPlan(workspace.plan),
            role,
            memberCount: workspace._count.members,
            storage: { usedBytes, limitBytes, remainingBytes: Math.max(limitBytes - usedBytes, 0) },
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt
        };
    }

    private mapPlan(plan: WorkspacePlan): WorkspacePlanLabel {
        switch (plan) {
            case WorkspacePlan.PRO:
                return 'Pro';
            case WorkspacePlan.TEAM:
                return 'Team';
            default:
                return 'Free';
        }
    }

    private workspaceListCacheKey(userId: string): string {
        return this.cacheService.key('workspace', 'list', 'user', userId);
    }

    private workspaceDetailCachePrefix(workspaceId: string): string {
        return this.cacheService.key('workspace', 'detail', workspaceId);
    }

    private workspaceDetailCacheKey(workspaceId: string, userId: string): string {
        return this.cacheService.key('workspace', 'detail', workspaceId, 'user', userId);
    }

    private invalidateWorkspaceListCaches(userIds: string[]): void {
        for (const userId of new Set(userIds)) {
            this.cacheService.del(this.workspaceListCacheKey(userId));
        }
    }

    private requireUserId(tokenData?: TokenData): string {
        const userId = tokenData?.sub?.trim();

        if (!userId) {
            throw new UnauthorizedException('Unauthorized');
        }

        return userId;
    }
}
