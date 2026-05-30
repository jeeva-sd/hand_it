import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { createId } from '@paralleldrive/cuid2';
import { Prisma } from '@prisma/client';
import { FastifyError } from 'fastify';
import { ResponseX } from '~/shared/types/replay.type';
import { readError } from '~/shared/utils/error-reader';
import { appConfig } from '~/system/config';

const excludeStatusesFromLogging = [400, 401, 403, 404];

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost): void {
        const response = host.switchToHttp().getResponse<ResponseX>();

        const resolved = this.resolveException(exception);

        const traceId =
            appConfig.server.allowExceptionLogs && !excludeStatusesFromLogging.includes(resolved.status)
                ? createId()
                : undefined;

        if (traceId) {
            this.safeLog(exception, traceId);
        }

        response
            .code(resolved.status)
            .send({
                statusCode: resolved.status,
                message: resolved.message,
                traceId,
                timestamp: new Date().toISOString()
            });
    }

    // ---------------------------------------------------------------------

    private resolveException(exception: unknown): { status: number; message: string; error?: unknown } {
        // --------------------------------------------------
        // Nest HTTP
        // --------------------------------------------------
        if (exception instanceof HttpException) {
            return {
                status: exception.getStatus(),
                message: readError(exception) ?? 'Request failed',
                error: exception.getResponse()
            };
        }

        if (
            typeof exception === 'object' &&
            exception !== null &&
            'name' in exception &&
            typeof (exception as Record<string, unknown>).name === 'string'
        ) {
            if ((exception as Record<string, unknown>).name === 'CorsError') {
                return {
                    status: HttpStatus.FORBIDDEN,
                    message: (exception as Record<string, unknown>).message as string
                };
            }
        }
        // --------------------------------------------------
        // Fastify errors (body / query / params)
        // --------------------------------------------------
        if (this.isFastifyError(exception)) {
            return {
                status: exception.statusCode ?? HttpStatus.BAD_REQUEST,
                message: this.resolveFastifyErrorMessage(exception)
            };
        }

        // --------------------------------------------------
        // Prisma — validation
        // --------------------------------------------------
        if (exception instanceof Prisma.PrismaClientValidationError) {
            return { status: HttpStatus.BAD_REQUEST, message: 'Invalid database input', error: exception };
        }

        // --------------------------------------------------
        // Prisma — known request errors
        // --------------------------------------------------
        if (exception instanceof Prisma.PrismaClientKnownRequestError) {
            return this.resolvePrismaKnownError(exception);
        }

        // --------------------------------------------------
        // Prisma — engine/runtime
        // --------------------------------------------------
        if (
            exception instanceof Prisma.PrismaClientInitializationError ||
            exception instanceof Prisma.PrismaClientRustPanicError ||
            exception instanceof Prisma.PrismaClientUnknownRequestError
        ) {
            return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Database engine error', error: exception };
        }

        // --------------------------------------------------
        // Thrown string / object
        // --------------------------------------------------
        if (typeof exception === 'string') {
            return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: exception };
        }

        // --------------------------------------------------
        // Fallback
        // --------------------------------------------------
        return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Unexpected error occurred', error: exception };
    }

    // ---------------------------------------------------------------------

    private resolvePrismaKnownError(exception: Prisma.PrismaClientKnownRequestError) {
        switch (exception.code) {
            case 'P2002':
                return {
                    status: HttpStatus.CONFLICT,
                    message: 'Duplicate record already exists',
                    error: exception.meta
                };

            case 'P2025':
                return { status: HttpStatus.NOT_FOUND, message: 'Record not found', error: exception.meta };

            case 'P2003':
                return { status: HttpStatus.BAD_REQUEST, message: 'Invalid relation reference', error: exception.meta };

            default:
                return {
                    status: HttpStatus.INTERNAL_SERVER_ERROR,
                    message: 'Database operation failed',
                    error: exception
                };
        }
    }

    // ---------------------------------------------------------------------

    private isFastifyError(err: unknown): err is FastifyError {
        return typeof err === 'object' && err !== null && 'code' in err && 'message' in err;
    }

    private resolveFastifyErrorMessage(error: FastifyError): string {
        const code = String(error.code || '').toUpperCase();
        const multipartLimits = appConfig.plugins.multipart.limits;

        if (code === 'FST_REQ_FILE_TOO_LARGE' || /file too large/i.test(error.message)) {
            return `The file is too large. Maximum allowed size is ${this.formatBytes(multipartLimits.fileSize)}.`;
        }

        if (code === 'FST_FILES_LIMIT') {
            const fileWord = multipartLimits.files === 1 ? 'file' : 'files';
            return `Too many files were uploaded. You can upload up to ${multipartLimits.files} ${fileWord} per request.`;
        }

        if (code === 'FST_FIELDS_LIMIT') {
            return `Too many form fields were submitted. Maximum allowed fields is ${multipartLimits.fields}.`;
        }

        if (code === 'FST_PARTS_LIMIT') {
            return 'Too much form data was submitted. Please reduce the number of files or fields and try again.';
        }

        if (code === 'FST_BODY_TOO_LARGE') {
            return `The request is too large. Maximum allowed size is ${this.formatBytes(appConfig.fastify.adapter.bodyLimit)}.`;
        }

        return error.message;
    }

    private formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

        const mb = bytes / (1024 * 1024);
        const rounded = Number.isInteger(mb) ? String(mb) : mb.toFixed(2).replace(/\.0+$/, '');
        return `${rounded} MB`;
    }

    // ---------------------------------------------------------------------

    private safeLog(exception: unknown, traceId: string) {
        try {
            this.logger.error(exception, traceId);
        } catch {
            this.logger.error('Failed to log exception', traceId);
        }
    }
}
