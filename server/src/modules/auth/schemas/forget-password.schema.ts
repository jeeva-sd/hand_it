import { z } from 'zod';

export const forgetPasswordSchema = z.object({ email: z.string().trim().toLowerCase().email() });

export type ForgetPasswordPayload = z.infer<typeof forgetPasswordSchema>;
