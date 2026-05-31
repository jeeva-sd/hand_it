import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const updateWorkspaceSchema = z
    .object({
        workspaceId: ID_SCHEMA,
        name: z
            .string()
            .trim()
            .min(2, 'Workspace name must be at least 2 characters long')
            .max(120, 'Workspace name must be at most 120 characters long')
            .optional()
    })
    .refine(payload => payload.name !== undefined, {
        message: 'At least one field must be provided for update',
        path: ['name']
    });

export type UpdateWorkspacePayload = z.infer<typeof updateWorkspaceSchema>;
