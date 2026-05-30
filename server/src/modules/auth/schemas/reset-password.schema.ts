import { z } from 'zod';

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be at most 128 characters long')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number');

export const resetPasswordSchema = z
    .object({ token: z.string().trim().min(1), password: passwordSchema, confirmPassword: z.string().min(1) })
    .refine(payload => payload.password === payload.confirmPassword, {
        message: 'Confirm password must match password',
        path: ['confirmPassword']
    });

export type ResetPasswordPayload = z.infer<typeof resetPasswordSchema>;
