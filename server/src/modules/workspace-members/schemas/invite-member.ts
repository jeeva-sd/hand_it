import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const inviteMemberInput = z.object({
    workspaceId: ID_SCHEMA,
    email: z.string().trim().email('Invalid email address'),
    role: z.nativeEnum(WorkspaceRole)
});

export type InviteMemberInputType = z.infer<typeof inviteMemberInput>;
