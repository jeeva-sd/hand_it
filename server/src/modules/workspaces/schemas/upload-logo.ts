import { z } from 'zod';
import { createFileRule, ID_SCHEMA } from '~/system';

export const uploadLogoInput = z.object({
    workspaceId: ID_SCHEMA,
    logo: createFileRule({
        allowedMimeTypes: ['image/png', 'image/jpeg'],
        maxFileSize: 1 * 1024 * 1024, // 1MB limit
        required: true,
        fieldName: 'logo'
    })
});

export type uploadLogoInput = z.infer<typeof uploadLogoInput>;
