import { z } from 'zod';

export const createWorkspaceInput = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Workspace name must be at least 2 characters long')
        .max(120, 'Workspace name must be at most 120 characters long')
});

export type createWorkspaceInput = z.infer<typeof createWorkspaceInput>;
