import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const projectPathSchema = z.object({ workspaceId: ID_SCHEMA, projectId: ID_SCHEMA });

export type ProjectPathPayload = z.infer<typeof projectPathSchema>;
