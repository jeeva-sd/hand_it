import { z } from 'zod';
import { createFileRule } from '~/system';

export const uploadProfileImageSchema = z.object({
    profileImage: createFileRule({
        allowedMimeTypes: ['image/png', 'image/jpeg'],
        maxFileSize: 1 * 1024 * 1024, // 1MB limit
        required: true,
        fieldName: 'profileImage'
    })
});

export type UploadProfileImagePayload = z.infer<typeof uploadProfileImageSchema>;
