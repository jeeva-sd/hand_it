import * as fs from 'node:fs/promises';
import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnauthorizedException
} from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import { WorkspaceRole } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { PrismaService, R2Service } from '~/integrations';
import { Store } from '~/shared/types/store.type';
import { appConfig } from '~/system/config';
import {
    CreateWorkspaceInputType,
    ListWorkspaceInputType,
    UpdateWorkspaceInputType,
    UploadLogoInputType,
    WorkspacePathInputType
} from './schemas';
import { WorkspaceRepository } from './workspace.repository';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceCacheService } from './workspace-cache.service';

const generateWorkspaceId = init({ length: 10 });
const _FREE_WORKSPACE_STORAGE_LIMIT_BYTES = BigInt(2 * 1024 * 1024 * 1024);

export interface WorkspaceSummary {
    id: string;
    name: string;
    plan: string;
    storageLimitBytes: number;
    storageUsedBytes: number;
    logoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    membersCount: number;
}

export interface WorkspaceDetailResponse extends WorkspaceSummary {
    role: WorkspaceRole;
}

@Injectable()
export class WorkspaceService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly workspaceRepository: WorkspaceRepository,
        private readonly cache: WorkspaceCacheService,
        private readonly access: WorkspaceAccessService,
        private readonly cls: ClsService<Store>,
        private readonly r2: R2Service
    ) {}

    private get userId(): string {
        const userId = this.cls.get('userId');
        if (!userId) {
            throw new UnauthorizedException('Unauthorized');
        }
        return userId;
    }

    private mapWorkspaceDetails(workspace: {
        id: string;
        name: string;
        plan: string;
        storageLimitBytes: bigint;
        storageUsedBytes: bigint;
        logoMime: string | null;
        createdAt: Date;
        updatedAt: Date;
        _count: { members: number };
    }): WorkspaceSummary {
        return {
            id: workspace.id,
            name: workspace.name,
            plan: workspace.plan,
            storageLimitBytes: Number(workspace.storageLimitBytes),
            storageUsedBytes: Number(workspace.storageUsedBytes),
            logoUrl: workspace.logoMime ? `${appConfig.backend.url}/api/v1/workspaces/${workspace.id}/logo` : null,
            createdAt: workspace.createdAt,
            updatedAt: workspace.updatedAt,
            membersCount: workspace._count.members
        };
    }

    async listWorkspaces(payload: ListWorkspaceInputType) {
        const userId = this.userId;
        const { page, size, searchTerm, sortBy, sortOrder } = payload;

        const cached = this.cache.getList(userId, payload);
        if (cached) {
            return cached;
        }

        const [workspaces, total] = await Promise.all([
            this.workspaceRepository.findWorkspaces(userId, searchTerm, sortBy, sortOrder, (page - 1) * size, size),
            this.workspaceRepository.countWorkspaces(userId, searchTerm)
        ]);

        const result = { total, workspaces };
        this.cache.setList(userId, payload, result);

        return result;
    }

    async createWorkspace(payload: CreateWorkspaceInputType) {
        const userId = this.userId;
        const workspaceId = generateWorkspaceId();

        const result = await this.workspaceRepository.createWorkspace(workspaceId, payload.name, userId, 0n);

        await this.workspaceRepository.updateUserLastWorkspace(userId, result.id);

        this.cache.invalidateLists([userId]);

        return { id: result.id };
    }

    private async getWorkspaceData(workspaceId: string, userId: string): Promise<WorkspaceDetailResponse> {
        let role = this.cache.getRole(workspaceId, userId);
        let workspace = this.cache.getDetail<WorkspaceSummary>(workspaceId);

        if (!(role || workspace)) {
            // Cold start: Combined query saves round-trips
            const member = await this.workspaceRepository.findMemberWorkspace(workspaceId, userId);
            if (!member) {
                throw new ForbiddenException('You do not have access to this workspace');
            }
            role = member.role;
            workspace = this.mapWorkspaceDetails(member.workspace);

            this.cache.setRole(workspaceId, userId, role);
            this.cache.setDetail(workspaceId, workspace);
        } else {
            // Verify membership / fetch role first if not cached
            if (!role) {
                role = await this.access.getRole(workspaceId, userId);
            }
            // Fetch workspace details if not cached
            if (!workspace) {
                const dbWorkspace = await this.workspaceRepository.findWorkspaceById(workspaceId);
                if (!dbWorkspace) {
                    throw new ForbiddenException('You do not have access to this workspace');
                }
                workspace = this.mapWorkspaceDetails(dbWorkspace);
                this.cache.setDetail(workspaceId, workspace);
            }
        }

        return { ...workspace, role };
    }

    async selectWorkspace(payload: WorkspacePathInputType) {
        const userId = this.userId;
        const workspaceId = payload.workspaceId;

        const result = await this.getWorkspaceData(workspaceId, userId);

        void (await this.workspaceRepository.updateUserLastWorkspace(userId, workspaceId));

        return result;
    }

    async getWorkspace(payload: WorkspacePathInputType) {
        return this.getWorkspaceData(payload.workspaceId, this.userId);
    }

    async updateWorkspace(payload: UpdateWorkspaceInputType) {
        const workspaceId = payload.workspaceId;

        const workspace = await this.workspaceRepository.updateWorkspace(workspaceId, payload.name);

        const memberUserIds = await this.workspaceRepository.findActiveMemberUserIds(workspaceId);

        this.cache.invalidateDetail(workspaceId);
        this.cache.invalidateLists(memberUserIds);

        return this.mapWorkspaceDetails(workspace);
    }

    async deleteWorkspace(payload: WorkspacePathInputType) {
        const workspaceId = payload.workspaceId;

        const memberUserIds = await this.prisma.$transaction(async tx => {
            const userIds = await this.workspaceRepository.findActiveMemberUserIds(workspaceId, tx);
            await this.workspaceRepository.deleteWorkspace(workspaceId, tx);
            return userIds;
        });

        this.cache.invalidateDetail(workspaceId);
        this.cache.invalidateLists(memberUserIds);
        this.cache.invalidateAllRoles(workspaceId);

        return { message: 'Workspace deleted successfully' };
    }

    async uploadLogo(payload: UploadLogoInputType) {
        const { workspaceId, logo } = payload;
        if (!logo || logo.length === 0) {
            throw new BadRequestException('Logo file is required');
        }
        const logoFile = logo[0];

        const dbWorkspace = await this.workspaceRepository.findWorkspaceById(workspaceId);
        if (!dbWorkspace) {
            throw new NotFoundException('Workspace not found');
        }

        const fileBuffer = await fs.readFile(logoFile.filePath);
        const key = `workspaces/${workspaceId}/logo`;
        await this.r2.uploadFile(key, fileBuffer, logoFile.mimetype);

        await this.workspaceRepository.updateWorkspaceLogo(workspaceId, logoFile.mimetype);

        this.cache.invalidateDetail(workspaceId);

        const memberUserIds = await this.workspaceRepository.findActiveMemberUserIds(workspaceId);
        this.cache.invalidateLists(memberUserIds);

        return { message: 'Logo uploaded successfully' };
    }

    async getLogo(workspaceId: string) {
        let workspace = this.cache.getDetail<WorkspaceSummary>(workspaceId);
        if (!workspace) {
            const dbWorkspace = await this.workspaceRepository.findWorkspaceById(workspaceId);
            if (!dbWorkspace) {
                throw new NotFoundException('Workspace not found');
            }
            workspace = this.mapWorkspaceDetails(dbWorkspace);
            this.cache.setDetail(workspaceId, workspace);
        }

        if (!workspace.logoUrl) {
            throw new NotFoundException('Workspace logo not found');
        }

        const key = `workspaces/${workspaceId}/logo`;
        try {
            const result = await this.r2.downloadFile(key);
            return { stream: result.Body, contentType: result.ContentType || 'image/png' };
        } catch (_error) {
            throw new NotFoundException('Workspace logo not found');
        }
    }
}
