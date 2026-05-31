import { z } from 'zod';

export const forgetPasswordSchema = z.object({
	email: z.string().trim().toLowerCase().email('Email must be a valid email address')
});

export type ForgetPasswordPayload = z.infer<typeof forgetPasswordSchema>;
