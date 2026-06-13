import { z } from 'zod';

export const updateProfileSchema = z.object({
    fname: z.string().trim().min(1, 'First name is required').max(50, 'First name must be at most 50 characters'),
    lname: z.string().trim().min(1, 'Last name is required').max(50, 'Last name must be at most 50 characters')
});

export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
