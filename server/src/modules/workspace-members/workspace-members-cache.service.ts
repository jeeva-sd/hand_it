import { Injectable } from '@nestjs/common';
import { CacheService } from '~/integrations';
import { ListMembersInputType } from './schemas';

@Injectable()
export class WorkspaceMembersCacheService {
    constructor(private readonly cache: CacheService) {}

    private getListKey(workspaceId: string, query: ListMembersInputType): string {
        return this.cache.key(
            'ws-mem',
            'list',
            workspaceId,
            String(query.page),
            String(query.size),
            query.searchTerm ?? '',
            query.sortBy,
            query.sortOrder
        );
    }

    getList<T>(workspaceId: string, query: ListMembersInputType): T | undefined {
        return this.cache.get<T>(this.getListKey(workspaceId, query));
    }

    setList<T>(workspaceId: string, query: ListMembersInputType, value: T): void {
        this.cache.set(this.getListKey(workspaceId, query), value, 60);
    }

    invalidateList(workspaceId: string): void {
        this.cache.delByPrefix(this.cache.key('ws-mem', 'list', workspaceId));
    }
}
