import { ProjectStatus } from '@prisma/client';
import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const updateProjectSchema = z.object({
    workspaceId: ID_SCHEMA,
    projectId: ID_SCHEMA,
    name: z
        .string()
        .trim()
        .min(2, 'Project name must be at least 2 characters long')
        .max(120, 'Project name must be at most 120 characters long')
        .optional(),
    description: z
        .string()
        .trim()
        .max(500, 'Project description must be at most 500 characters long')
        .optional()
        .nullable(),
    status: z.nativeEnum(ProjectStatus).optional()
});

export type UpdateProjectPayload = z.infer<typeof updateProjectSchema>;
