import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { appConfig } from '~/system/config';

interface PerformanceMetrics {
    method: string;
    url: string;
    duration: number;
    statusCode: number;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
    private readonly logger = new Logger(PerformanceInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        if (!appConfig.monitoring.performance.enabled) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const startTime = Date.now();

        return next.handle().pipe(
            tap({
                next: () => {
                    this.logPerformanceMetrics({
                        method: request.method,
                        url: request.url,
                        duration: Date.now() - startTime,
                        statusCode: response.statusCode
                    });
                },
                error: error => {
                    this.logPerformanceMetrics({
                        method: request.method,
                        url: request.url,
                        duration: Date.now() - startTime,
                        statusCode: error?.status ?? 500
                    });
                }
            })
        );
    }

    private logPerformanceMetrics(metrics: PerformanceMetrics) {
        const { method, url, statusCode } = metrics;
        const duration = metrics.duration;

        if (duration > appConfig.monitoring.performance.slowRequestThreshold) {
            this.logger.warn(`SLOW REQUEST: ${method} ${url} - ${duration}ms (${statusCode})`);
        } else if (duration > appConfig.monitoring.performance.mediumRequestThreshold) {
            this.logger.log(`MEDIUM REQUEST: ${method} ${url} - ${duration}ms (${statusCode})`);
        }
    }
}
