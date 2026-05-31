import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const workspaceProjectPathSchema = z.object({ workspaceId: ID_SCHEMA, projectId: ID_SCHEMA });

export type WorkspaceProjectPathPayload = z.infer<typeof workspaceProjectPathSchema>;
