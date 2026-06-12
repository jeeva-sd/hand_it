import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const updateMemberInput = z.object({
    workspaceId: ID_SCHEMA,
    memberId: ID_SCHEMA,
    role: z.nativeEnum(WorkspaceRole)
});

export type UpdateMemberInputType = z.infer<typeof updateMemberInput>;
