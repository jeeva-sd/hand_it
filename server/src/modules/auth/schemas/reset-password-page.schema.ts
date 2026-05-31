import { z } from 'zod';

export const resetPasswordPageSchema = z.object({ token: z.string().trim().optional().default('') });

export type ResetPasswordPagePayload = z.infer<typeof resetPasswordPageSchema>;
