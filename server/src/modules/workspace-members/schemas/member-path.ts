import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const memberPathInput = z.object({ workspaceId: ID_SCHEMA, memberId: ID_SCHEMA });

export type MemberPathInputType = z.infer<typeof memberPathInput>;
