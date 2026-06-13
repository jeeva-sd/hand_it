import { FastifyRequest } from 'fastify';
import { FileDetail } from '~/system/validation/req-payload.guard';

export type TokenData = {
    sub: string; // userId
    workspaceId: string;
    roleId: string;
    accessId: string;
};

export interface RequestX<T> extends FastifyRequest {
    user: TokenData;
    userPermissions?: string[];
    payload: T;
    startTime?: number;
    uploadedFiles?: FileDetail[];
    skipFileCleanup?: boolean; // Flag to skip file cleanup entirely
    skipFileCleanupFields?: string[]; // Field names whose files should not be deleted
}
