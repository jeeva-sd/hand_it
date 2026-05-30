import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { CacheProvider } from './cache.types';

type CacheValue = NonNullable<unknown>;

@Injectable()
export class CacheService implements CacheProvider {
    private readonly cache: LRUCache<string, CacheValue>;
    private readonly defaultTtlMs = 5 * 60 * 1000;

    constructor() {
        this.cache = new LRUCache<string, CacheValue>({ max: 5000, ttl: this.defaultTtlMs, allowStale: false });
    }

    key(...parts: Array<string | number | boolean | null | undefined>): string {
        return parts
            .filter(part => part !== undefined && part !== null && part !== '')
            .map(part => String(part))
            .join(':');
    }

    get<T>(key: string): T | undefined {
        return this.cache.get(key) as T | undefined;
    }

    set<T>(key: string, value: T, ttlSeconds?: number): void {
        const ttlMs = ttlSeconds && ttlSeconds > 0 ? ttlSeconds * 1000 : this.defaultTtlMs;
        this.cache.set(key, value as CacheValue, { ttl: ttlMs });
    }

    del(key: string): void {
        this.cache.delete(key);
    }

    delByPrefix(prefix: string): number {
        let deleted = 0;

        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
                deleted++;
            }
        }

        return deleted;
    }

    clear(): void {
        this.cache.clear();
    }
}
