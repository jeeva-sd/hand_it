import { z } from 'zod';
import { ID_SCHEMA } from '~/system';

export const profileImageParamsSchema = z.object({ userId: ID_SCHEMA });

export type ProfileImageParamsPayload = z.infer<typeof profileImageParamsSchema>;
