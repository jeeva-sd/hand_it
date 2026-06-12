import { z } from 'zod';
import { createPaginationSchema, ID_SCHEMA } from '~/system';

export const listMembersInput = z
    .object({ workspaceId: ID_SCHEMA })
    .merge(createPaginationSchema(['createdAt', 'role'], 'createdAt'));

export type ListMembersInputType = z.infer<typeof listMembersInput>;
