import { ProjectStatus } from '@prisma/client';
import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const createProjectSchema = z.object({
    workspaceId: ID_SCHEMA,
    name: z
        .string()
        .trim()
        .min(2, 'Project name must be at least 2 characters long')
        .max(120, 'Project name must be at most 120 characters long'),
    description: z
        .string()
        .trim()
        .max(500, 'Project description must be at most 500 characters long')
        .optional()
        .nullable(),
    status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE)
});

export type CreateProjectPayload = z.infer<typeof createProjectSchema>;
