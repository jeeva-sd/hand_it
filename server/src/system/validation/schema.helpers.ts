import { z } from 'zod';

const trueValues = new Set([true, 'true', '1', 1]);

export const boolFromUnknown = z.any().transform(value => trueValues.has(value));

export const optionalBoolean = () => boolFromUnknown.optional();

export const defaultBoolean = (value: boolean) => boolFromUnknown.optional().default(value);

export const optionalDate = () =>
    z.preprocess(value => (value === null ? undefined : value), z.coerce.date().optional());

export const nullableOptionalDate = () =>
    z.preprocess(value => (value === null ? null : value), z.coerce.date().nullable().optional());

export const requiredDate = () => z.preprocess(value => (value === null ? undefined : value), z.coerce.date());

export const ID_SCHEMA = z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]+$/, 'ID must contain only alphanumeric characters, underscores, and hyphens')
    .min(1);

/**
 * PAGE_SCHEMA: Pagination page number
 * - Must be a positive integer (min: 1)
 * - Defaults to 1
 * - Rejects: 0, negative numbers, non-integers
 * - Error message is clear about the constraint
 */
export const PAGE_SCHEMA = z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be 1 or greater')
    .default(1);

/**
 * SIZE_SCHEMA: Pagination page size (items per page)
 * - Minimum: 1 item per page
 * - Maximum: 100 items per page (DoS prevention)
 * - Default: 10 items per page
 * - Rejects: 0, negative numbers, values > 100, non-integers
 * - Error messages guide users to valid ranges
 */
export const SIZE_SCHEMA = z.coerce
    .number()
    .int('Size must be an integer')
    .min(1, 'Size must be at least 1 item per page')
    .max(100, 'Size cannot exceed 100 items per page (maximum 100 items allowed)')
    .default(10);

export const SEARCH_TERM_SCHEMA = z.string().trim().max(100, 'Search term cannot exceed 100 characters').optional();

const SORT_ORDER_OPTIONS = ['asc', 'desc'] as const;
export const SORT_ORDER_SCHEMA = z.enum(SORT_ORDER_OPTIONS).default('desc');

export const LIST_QUERY_BASE_SCHEMA = z.object({
    workspaceId: ID_SCHEMA,
    page: PAGE_SCHEMA,
    size: SIZE_SCHEMA,
    searchTerm: SEARCH_TERM_SCHEMA,
    sortOrder: SORT_ORDER_SCHEMA
});
