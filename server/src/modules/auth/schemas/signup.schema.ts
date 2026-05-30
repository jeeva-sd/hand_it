import { z } from 'zod';

export const signupSchema = z.object({
    fname: z.string().trim().min(2).max(50),
    lname: z.string().trim().min(1).max(50),
    email: z.string().trim().toLowerCase().email()
});

export type SignupPayload = z.infer<typeof signupSchema>;
