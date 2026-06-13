import { WorkspaceRole } from '@prisma/client';
import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const inviteMemberInput = z.object({
    workspaceId: ID_SCHEMA,
    email: z.string().email().max(255).transform(v => v.toLowerCase().trim()),
    role: z.nativeEnum(WorkspaceRole)
});

export type InviteMemberInputType = z.infer<typeof inviteMemberInput>;
