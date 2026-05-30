import { z } from 'zod';

export const resetPasswordPageSchema = z.object({ token: z.string().trim().min(1) });

export type ResetPasswordPagePayload = z.infer<typeof resetPasswordPageSchema>;
