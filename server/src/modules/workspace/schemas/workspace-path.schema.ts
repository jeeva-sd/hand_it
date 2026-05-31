import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const workspacePathSchema = z.object({ workspaceId: ID_SCHEMA });

export type WorkspacePathPayload = z.infer<typeof workspacePathSchema>;
