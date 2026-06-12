import { z } from 'zod';
import { createPaginationSchema } from '~/system';

export const listWorkspaceInput = createPaginationSchema(['createdAt', 'name'], 'createdAt');

export type listWorkspaceInput = z.infer<typeof listWorkspaceInput>;
