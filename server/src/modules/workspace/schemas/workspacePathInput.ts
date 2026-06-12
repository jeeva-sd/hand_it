import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const workspacePathInput = z.object({ workspaceId: ID_SCHEMA });

export type workspacePathInput = z.infer<typeof workspacePathInput>;
