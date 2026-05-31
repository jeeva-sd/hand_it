import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    NotFoundException,
    SetMetadata
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '@prisma/client';
import { ProjectRepository } from '../repositories/project.repository';

export enum ProjectAction {
    VIEW = 'VIEW',
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    FAVORITE = 'FAVORITE'
}

export const PROJECT_ACTION_KEY = 'project_action';
export const RequireAction = (action: ProjectAction) => SetMetadata(PROJECT_ACTION_KEY, action);

const WRITE_ROLES = new Set<WorkspaceRole>([WorkspaceRole.OWNER, WorkspaceRole.ADMIN, WorkspaceRole.MEMBER]);
const READ_ROLES = new Set<WorkspaceRole>([
    WorkspaceRole.OWNER,
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
    WorkspaceRole.VIEWER
]);

@Injectable()
export class ProjectActionGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly projectRepository: ProjectRepository
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const action = this.reflector.get<ProjectAction>(PROJECT_ACTION_KEY, context.getHandler());
        if (!action) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const userId = request.user?.sub?.trim();
        if (!userId) {
            return false;
        }

        // Extract workspaceId and projectId from path params or sanitized payload
        const workspaceId = request.params?.workspaceId ?? request.payload?.workspaceId;
        const projectIdRaw = request.params?.projectId ?? request.payload?.projectId;
        const projectId = projectIdRaw !== ':projectId' ? projectIdRaw : undefined;

        if (!workspaceId) {
            throw new ForbiddenException('Workspace ID is required for authorization');
        }

        // Validate membership
        const membership = await this.projectRepository.findWorkspaceMembership({ workspaceId, userId });
        if (!membership) {
            throw new ForbiddenException('You do not have access to this workspace');
        }

        const userRole = membership.role;

        // Perform authorization based on Action type
        if (action === ProjectAction.CREATE || action === ProjectAction.UPDATE || action === ProjectAction.DELETE) {
            if (!WRITE_ROLES.has(userRole)) {
                throw new ForbiddenException('You do not have permission to modify projects in this workspace');
            }
        } else {
            if (!READ_ROLES.has(userRole)) {
                throw new ForbiddenException('You do not have permission to view projects in this workspace');
            }
        }

        // If specific projectId is targeted, verify project existence and workspace ownership
        if (projectId) {
            const project = await this.projectRepository.findProjectById({ workspaceId, projectId });
            if (!project) {
                throw new NotFoundException('Project not found in this workspace');
            }
            // Store project on request to avoid re-querying in helper methods
            request.matchedProject = project;
        }

        return true;
    }
}
