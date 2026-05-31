import { ProjectStatus } from '@prisma/client';
import { z } from 'zod';
import { LIST_QUERY_BASE_SCHEMA } from '~/system';

export const projectQuerySchema = LIST_QUERY_BASE_SCHEMA.extend({ status: z.nativeEnum(ProjectStatus).optional() });

export type ProjectQueryPayload = z.infer<typeof projectQuerySchema>;
