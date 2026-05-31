import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ProjectStatus, WorkspaceRole } from '@prisma/client';
import { CacheService } from '~/integrations';
import { TokenData } from '~/shared/types/request.type';
import { ProjectRecord, ProjectRepository } from '../repositories/project.repository';
import { CreateProjectPayload, ProjectPathPayload, ProjectQueryPayload, UpdateProjectPayload } from '../schemas';

const PROJECT_LIST_CACHE_TTL_SECONDS = 60;
const PROJECT_DETAIL_CACHE_TTL_SECONDS = 90;
const EDITABLE_PROJECT_ROLES = new Set<WorkspaceRole>([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER]);

type ProjectStatusLabel = 'Active' | 'Paused' | 'Draft' | 'Archived';

type ProjectResponse = {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    status: ProjectStatusLabel;
    createdAt: string;
    updatedAt: string;
    fileCount: number;
    shareCount: number;
    members: string[];
    isFavorite: boolean;
};

type PaginatedProjectsResponse = {
    projects: ProjectResponse[];
    meta: { totalItems: number; totalPages: number; currentPage: number; pageSize: number };
};

@Injectable()
export class ProjectService {
    constructor(
        private readonly projectRepository: ProjectRepository,
        private readonly cacheService: CacheService
    ) {}

    async listProjects(payload: ProjectQueryPayload, tokenData?: TokenData): Promise<PaginatedProjectsResponse> {
        const userId = this.requireUserId(tokenData);
        const { workspaceId, page, size, searchTerm, status, sortOrder } = payload;

        const membership = await this.projectRepository.findWorkspaceMembership({ workspaceId, userId });
        if (!membership) {
            throw new ForbiddenException('You do not have access to this workspace');
        }

        const cacheKey = this.projectListCacheKey(payload);
        const cached = this.cacheService.get<PaginatedProjectsResponse>(cacheKey);
        if (cached) {
            return cached;
        }

        const totalItems = await this.projectRepository.countProjects({ workspaceId, searchTerm, status });

        const records = await this.projectRepository.listProjectsPaginated({
            workspaceId,
            page,
            size,
            searchTerm,
            sortOrder,
            status
        });

        // Fetch favorite statuses for these records
        const favoritedIds = await this.projectRepository.findFavoriteProjectIds({
            userId,
            projectIds: records.map(r => r.id)
        });

        const projects = records.map(record => this.mapProject(record, favoritedIds.has(record.id)));
        const totalPages = Math.ceil(totalItems / size) || 1;

        const result: PaginatedProjectsResponse = {
            projects,
            meta: { totalItems, totalPages, currentPage: page, pageSize: size }
        };

        this.cacheService.set(cacheKey, result, PROJECT_LIST_CACHE_TTL_SECONDS);

        return result;
    }

    async getProject(payload: ProjectPathPayload, tokenData?: TokenData): Promise<{ project: ProjectResponse }> {
        const userId = this.requireUserId(tokenData);
        const { workspaceId, projectId } = payload;

        const membership = await this.projectRepository.findWorkspaceMembership({ workspaceId, userId });
        if (!membership) {
            throw new ForbiddenException('You do not have access to this workspace');
        }

        const cacheKey = this.projectDetailCacheKey(workspaceId, projectId);
        const cached = this.cacheService.get<ProjectResponse>(cacheKey);
        if (cached) {
            return { project: cached };
        }

        const project = await this.projectRepository.findProjectById({ workspaceId, projectId });
        if (!project) {
            throw new NotFoundException('Project not found in this workspace');
        }

        const favoritedIds = await this.projectRepository.findFavoriteProjectIds({ userId, projectIds: [projectId] });

        const mapped = this.mapProject(project, favoritedIds.has(projectId));
        this.cacheService.set(cacheKey, mapped, PROJECT_DETAIL_CACHE_TTL_SECONDS);

        return { project: mapped };
    }

    async createProject(payload: CreateProjectPayload, tokenData?: TokenData): Promise<{ project: ProjectResponse }> {
        const userId = this.requireUserId(tokenData);
        const { workspaceId, name, description, status } = payload;

        const membership = await this.projectRepository.findWorkspaceMembership({ workspaceId, userId });
        if (!membership) {
            throw new ForbiddenException('You do not have access to this workspace');
        }

        if (!EDITABLE_PROJECT_ROLES.has(membership.role)) {
            throw new ForbiddenException('You do not have permission to create projects in this workspace');
        }

        const project = await this.projectRepository.createProject({ workspaceId, name, description, status });

        const mapped = this.mapProject(project, false);

        // Clear all projects caches for this workspace
        this.invalidateProjectCaches(workspaceId);

        return { project: mapped };
    }

    async updateProject(payload: UpdateProjectPayload, tokenData?: TokenData): Promise<{ project: ProjectResponse }> {
        const userId = this.requireUserId(tokenData);
        const { workspaceId, projectId, name, description, status } = payload;

        const membership = await this.projectRepository.findWorkspaceMembership({ workspaceId, userId });
        if (!membership) {
            throw new ForbiddenException('You do not have access to this workspace');
        }

        if (!EDITABLE_PROJECT_ROLES.has(membership.role)) {
            throw new ForbiddenException('You do not have permission to update projects in this workspace');
        }

        const existingProject = await this.projectRepository.findProjectById({ workspaceId, projectId });
        if (!existingProject) {
            throw new NotFoundException('Project not found in this workspace');
        }

        const project = await this.projectRepository.updateProject({ projectId, name, description, status });

        const favoritedIds = await this.projectRepository.findFavoriteProjectIds({ userId, projectIds: [projectId] });

        const mapped = this.mapProject(project, favoritedIds.has(projectId));

        // Clear all projects caches for this workspace
        this.invalidateProjectCaches(workspaceId);

        return { project: mapped };
    }

    async deleteProject(payload: ProjectPathPayload, tokenData?: TokenData): Promise<{ message: string }> {
        const userId = this.requireUserId(tokenData);
        const { workspaceId, projectId } = payload;

        const membership = await this.projectRepository.findWorkspaceMembership({ workspaceId, userId });
        if (!membership) {
            throw new ForbiddenException('You do not have access to this workspace');
        }

        if (!EDITABLE_PROJECT_ROLES.has(membership.role)) {
            throw new ForbiddenException('You do not have permission to delete projects in this workspace');
        }

        const existingProject = await this.projectRepository.findProjectById({ workspaceId, projectId });
        if (!existingProject) {
            throw new NotFoundException('Project not found in this workspace');
        }

        await this.projectRepository.deleteProject({ projectId });

        // Clear all projects caches for this workspace
        this.invalidateProjectCaches(workspaceId);

        return { message: 'Project deleted successfully' };
    }

    async favoriteProject(payload: ProjectPathPayload, tokenData?: TokenData): Promise<{ project: ProjectResponse }> {
        const userId = this.requireUserId(tokenData);
        const { workspaceId, projectId } = payload;

        const project = await this.projectRepository.findProjectById({ workspaceId, projectId });
        if (!project) {
            throw new NotFoundException('Project not found in this workspace');
        }

        await this.projectRepository.favoriteProject({ projectId, userId });

        const mapped = this.mapProject(project, true);

        // Clear all projects caches for this workspace
        this.invalidateProjectCaches(workspaceId);

        return { project: mapped };
    }

    async unfavoriteProject(payload: ProjectPathPayload, tokenData?: TokenData): Promise<{ project: ProjectResponse }> {
        const userId = this.requireUserId(tokenData);
        const { workspaceId, projectId } = payload;

        const project = await this.projectRepository.findProjectById({ workspaceId, projectId });
        if (!project) {
            throw new NotFoundException('Project not found in this workspace');
        }

        await this.projectRepository.unfavoriteProject({ projectId, userId });

        const mapped = this.mapProject(project, false);

        // Clear all projects caches for this workspace
        this.invalidateProjectCaches(workspaceId);

        return { project: mapped };
    }

    private mapProject(project: ProjectRecord, isFavorite = false): ProjectResponse {
        return {
            id: project.id,
            workspaceId: project.workspaceId,
            name: project.name,
            description: project.description ?? '',
            status: this.mapProjectStatus(project.status),
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
            fileCount: 0,
            shareCount: 0,
            members: [],
            isFavorite
        };
    }

    private mapProjectStatus(status: ProjectStatus): ProjectStatusLabel {
        switch (status) {
            case ProjectStatus.PAUSED:
                return 'Paused';
            case ProjectStatus.DRAFT:
                return 'Draft';
            case ProjectStatus.ARCHIVED:
                return 'Archived';
            default:
                return 'Active';
        }
    }

    private projectListCacheKey(payload: ProjectQueryPayload): string {
        return this.cacheService.key(
            'workspace',
            payload.workspaceId,
            'projects',
            'list',
            'page',
            payload.page,
            'size',
            payload.size,
            'search',
            payload.searchTerm,
            'status',
            payload.status,
            'sort',
            payload.sortOrder
        );
    }

    private projectDetailCacheKey(workspaceId: string, projectId: string): string {
        return this.cacheService.key('workspace', workspaceId, 'projects', 'detail', projectId);
    }

    private invalidateProjectCaches(workspaceId: string): void {
        const prefix = this.cacheService.key('workspace', workspaceId, 'projects');
        this.cacheService.delByPrefix(prefix);
    }

    private requireUserId(tokenData?: TokenData): string {
        const userId = tokenData?.sub?.trim();

        if (!userId) {
            throw new UnauthorizedException('Unauthorized');
        }

        return userId;
    }
}
