import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    SetMetadata,
    UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { WorkspaceRole } from '@prisma/client';
import { ClsService } from 'nestjs-cls';
import { Store } from '~/shared/types/store.type';
import { WorkspaceAccessService } from './workspace-access.service';

export const WORKSPACE_ROLES_KEY = 'workspaceRoles';
export const RequireWorkspaceRoles = (...roles: WorkspaceRole[]) => SetMetadata(WORKSPACE_ROLES_KEY, roles);

@Injectable()
export class WorkspaceRoleGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly access: WorkspaceAccessService,
        private readonly cls: ClsService<Store>
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(WORKSPACE_ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        const workspaceId =
            request.payload?.workspaceId ||
            request.params?.workspaceId ||
            request.body?.workspaceId ||
            request.query?.workspaceId;

        if (!workspaceId) {
            throw new ForbiddenException('Workspace ID is required');
        }

        const userId = this.cls.get('userId');
        if (!userId) {
            throw new UnauthorizedException('Unauthorized');
        }

        const role = await this.access.assertRole(workspaceId, userId, requiredRoles);

        // Store workspaceContext ergonomically in CLS
        this.cls.set('workspaceId', workspaceId);
        this.cls.set('workspaceRole', role);

        return true;
    }
}
