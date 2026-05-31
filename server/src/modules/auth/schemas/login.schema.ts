import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email('Email must be a valid email address'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters long')
        .max(128, 'Password must be at most 128 characters long')
});

export type LoginPayload = z.infer<typeof loginSchema>;
