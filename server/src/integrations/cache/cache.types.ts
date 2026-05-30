export interface CacheProvider {
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T, ttlSeconds?: number): void;
    del(key: string): void;
    delByPrefix(prefix: string): number;
    clear(): void;
    key(...parts: Array<string | number | boolean | null | undefined>): string;
}
