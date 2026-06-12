import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const workspaceMemberPathInput = z.object({ workspaceId: ID_SCHEMA });

export type WorkspaceMemberPathInputType = z.infer<typeof workspaceMemberPathInput>;
