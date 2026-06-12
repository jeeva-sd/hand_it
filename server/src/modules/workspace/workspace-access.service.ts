import { ForbiddenException, Injectable } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { WorkspaceRepository } from './workspace.repository';
import { WorkspaceCacheService } from './workspace-cache.service';

@Injectable()
export class WorkspaceAccessService {
    constructor(
        private readonly workspaceRepository: WorkspaceRepository,
        private readonly cache: WorkspaceCacheService
    ) {}

    async getRole(workspaceId: string, userId: string): Promise<WorkspaceRole> {
        let role = this.cache.getRole(workspaceId, userId);
        if (!role) {
            const dbRole = await this.workspaceRepository.findMemberRole(workspaceId, userId);
            if (!dbRole) {
                throw new ForbiddenException('You do not have access to this workspace');
            }
            role = dbRole;
            this.cache.setRole(workspaceId, userId, role);
        }
        return role;
    }

    async assertRole(workspaceId: string, userId: string, allowedRoles: WorkspaceRole[]): Promise<WorkspaceRole> {
        const role = await this.getRole(workspaceId, userId);
        if (!allowedRoles.includes(role)) {
            throw new ForbiddenException(`Access denied. Allowed roles: ${allowedRoles.join(', ')}`);
        }
        return role;
    }
}
