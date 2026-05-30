import { FastifyRequest } from 'fastify';
import { ExtractJwt } from 'passport-jwt';
import { appConfig } from '~/system/config';

type GetTokenOptions = { includeQueryToken?: boolean; cookieNames?: string[] };

const normalizeToken = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const token = value.trim();
    if (!token) {
        return null;
    }

    if (token.startsWith('Bearer ')) {
        const bearerToken = token.slice('Bearer '.length).trim();
        return bearerToken || null;
    }

    return token;
};

const readCookieToken = (request: FastifyRequest, cookieNames: string[]): string | null => {
    const cookies = (request.cookies ?? {}) as Record<string, unknown>;

    for (const cookieName of cookieNames) {
        const token = normalizeToken(cookies[cookieName]);
        if (token) {
            return token;
        }
    }

    return null;
};

export const getToken = (request: FastifyRequest, options: GetTokenOptions = {}): string | null => {
    const headerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (headerToken) {
        return headerToken;
    }

    if (options.includeQueryToken === true) {
        const queryToken = ExtractJwt.fromUrlQueryParameter('token')(request);
        const normalizedQueryToken = queryToken?.trim();
        if (normalizedQueryToken) {
            return normalizedQueryToken;
        }
    }

    const fallbackCookieNames = appConfig.auth.tokenCookieNames;
    const cookieNames = options.cookieNames?.length ? options.cookieNames : fallbackCookieNames;

    return readCookieToken(request, cookieNames);
};
