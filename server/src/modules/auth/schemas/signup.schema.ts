import { z } from 'zod';

export const signupSchema = z.object({
    fname: z
        .string()
        .trim()
        .min(2, 'First name must be at least 2 characters long')
        .max(50, 'First name must be at most 50 characters long'),
    lname: z
        .string()
        .trim()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be at most 50 characters long'),
    email: z.string().trim().toLowerCase().email('Email must be a valid email address')
});

export type SignupPayload = z.infer<typeof signupSchema>;
