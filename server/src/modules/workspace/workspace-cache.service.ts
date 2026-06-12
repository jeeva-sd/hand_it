import { Injectable } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { CacheService } from '~/integrations';
import { ListWorkspaceInputType } from './schemas';

@Injectable()
export class WorkspaceCacheService {
    constructor(private readonly cache: CacheService) {}

    // Lists (build positional keys directly, bypassing object serialization)
    private getListKey(userId: string, query: ListWorkspaceInputType): string {
        return this.cache.key(
            'ws',
            'list',
            userId,
            String(query.page),
            String(query.size),
            query.searchTerm ?? '',
            query.sortBy,
            query.sortOrder
        );
    }

    getList<T>(userId: string, query: ListWorkspaceInputType): T | undefined {
        return this.cache.get<T>(this.getListKey(userId, query));
    }

    setList<T>(userId: string, query: ListWorkspaceInputType, value: T): void {
        this.cache.set(this.getListKey(userId, query), value, 60);
    }

    invalidateLists(userIds: string[]): void {
        for (const userId of new Set(userIds)) {
            this.cache.delByPrefix(this.cache.key('ws', 'list', userId));
        }
    }

    // Workspace Details (cached globally)
    getDetail<T>(workspaceId: string): T | undefined {
        return this.cache.get<T>(this.cache.key('ws', 'det', workspaceId));
    }

    setDetail<T>(workspaceId: string, value: T): void {
        this.cache.set(this.cache.key('ws', 'det', workspaceId), value, 90);
    }

    invalidateDetail(workspaceId: string): void {
        this.cache.del(this.cache.key('ws', 'det', workspaceId));
    }

    // User Workspace Roles
    getRole(workspaceId: string, userId: string): WorkspaceRole | undefined {
        return this.cache.get<WorkspaceRole>(this.cache.key('ws', 'role', workspaceId, userId));
    }

    setRole(workspaceId: string, userId: string, role: WorkspaceRole): void {
        this.cache.set(this.cache.key('ws', 'role', workspaceId, userId), role, 3600);
    }

    invalidateRole(workspaceId: string, userId: string): void {
        this.cache.del(this.cache.key('ws', 'role', workspaceId, userId));
    }

    invalidateAllRoles(workspaceId: string): void {
        this.cache.delByPrefix(this.cache.key('ws', 'role', workspaceId));
    }
}
