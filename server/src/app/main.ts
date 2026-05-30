import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import compression from '@fastify/compress';
import fastifyCookies from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyHelmet from '@fastify/helmet';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import { fastifyStatic } from '@fastify/static';
import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { createRmqMicroserviceOptions, RABBIT_MQ_QUEUE_KEYS } from '~/integrations';
import { RequestX } from '~/shared/types/request.type';
import { appConfig } from '~/system/config';
import { HttpExceptionFilter } from '~/system/exceptions/http-exception.filter';
import { PerformanceInterceptor } from '~/system/logging/performance.interceptor';
import { PayloadGuard } from '~/system/validation/req-payload.guard';
import { AppModule } from './app.module';

class App {
    private app!: NestFastifyApplication;
    private reflector!: Reflector;
    private isShuttingDown = false;
    private logger = new Logger(App.name);

    private async cleanupUploadedFiles(request: RequestX<unknown>) {
        const uploadedFiles = request.uploadedFiles ?? [];
        if (uploadedFiles.length === 0) {
            return;
        }

        if (request.skipFileCleanup) {
            return;
        }

        const skipFileCleanupFields = request.skipFileCleanupFields;
        const filesToDelete =
            !skipFileCleanupFields || skipFileCleanupFields.length === 0
                ? uploadedFiles
                : uploadedFiles.filter(file => !skipFileCleanupFields.includes(file.fieldname));

        if (filesToDelete.length === 0) {
            return;
        }

        await Promise.allSettled(filesToDelete.map(file => fs.unlink(file.filePath)));
    }

    async createApp() {
        const fastifyAdapter = new FastifyAdapter({
            logger: appConfig.fastify.adapter.logger,
            trustProxy: appConfig.fastify.adapter.trustProxy, // Enable if behind reverse proxy (load balancer, nginx)
            routerOptions: {
                ignoreTrailingSlash: appConfig.fastify.adapter.ignoreTrailingSlash, // Treat /api/users and /api/users/ as same route
                ignoreDuplicateSlashes: appConfig.fastify.adapter.ignoreDuplicateSlashes, // Treat /api//users as /api/users
                caseSensitive: appConfig.fastify.adapter.caseSensitive, // Make routes case insensitive
                maxParamLength: appConfig.fastify.adapter.maxParamLength // Maximum length for URL parameters
            }
        });

        this.app = await NestFactory.create<NestFastifyApplication>(AppModule, fastifyAdapter, {
            bufferLogs: appConfig.server.bufferLogs, // Buffer logs during startup for better performance
            abortOnError: appConfig.server.abortOnError // Continue startup even if some modules fail
        });

        // Cache reflector instance for reuse across guards and interceptors
        this.reflector = this.app.get(Reflector);
    }

    // Set up Fastify hooks
    setupHooks() {
        const appInstance = this.app.getHttpAdapter().getInstance();
        const shouldTrackRequestTiming =
            appConfig.server.mode === 'development' &&
            appConfig.fastify.hooks.performanceLogging &&
            appConfig.fastify.hooks.enableRequestTiming;
        const shouldCleanupUploadedFiles = appConfig.plugins.multipart.enabled;

        if (!(shouldTrackRequestTiming || shouldCleanupUploadedFiles)) {
            return;
        }

        // Add performance monitoring hook
        if (shouldTrackRequestTiming) {
            appInstance.addHook('onRequest', request => {
                const req = request as RequestX<unknown>;
                req.startTime = Date.now(); // Track request start time for performance monitoring
            });
        }

        // File cleanup hook
        appInstance.addHook('onResponse', request => {
            const req = request as RequestX<unknown>;

            if (shouldCleanupUploadedFiles) {
                // Cleanup is intentionally fire-and-forget to avoid adding response latency.
                void this.cleanupUploadedFiles(req).catch(() => undefined);
            }

            // Log response time in development if performance logging is enabled
            if (shouldTrackRequestTiming && req.startTime) {
                const duration = Date.now() - req.startTime;
                if (duration > appConfig.fastify.hooks.slowRequestThreshold) {
                    this.logger.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);
                }
            }
        });
    }

    // Register Fastify plugins based on configuration with proper ordering and settings
    async setupPlugins() {
        // Security plugins first (critical for security)
        if (appConfig.plugins.helmet.enabled) {
            await this.app.register(fastifyHelmet, { crossOriginResourcePolicy: { policy: 'cross-origin' } }); // Adds security headers like CSP, HSTS, etc.
        }

        // Register core plugins in parallel where dependencies allow
        const corePlugins = [];

        if (appConfig.plugins.cors.enabled) {
            const staticOrigins = new Set(appConfig.plugins.cors.origin);
            const patterns = appConfig.plugins.cors.originPatterns.map(pattern => new RegExp(pattern));

            corePlugins.push(
                this.app.register(fastifyCors, {
                    origin: (origin, callback) => {
                        if (!origin) return callback(null, true);

                        if (staticOrigins.has(origin)) return callback(null, true);
                        if (patterns.some(pattern => pattern.test(origin))) return callback(null, true);

                        const err = new Error(`CORS: origin ${origin} not allowed`);
                        err.name = 'CorsError';
                        return callback(err, false);
                    },
                    credentials: appConfig.plugins.cors.credentials,
                    methods: appConfig.plugins.cors.methods
                })
            );
        }

        if (appConfig.plugins.cookies.enabled) {
            corePlugins.push(this.app.register(fastifyCookies)); // Enable cookie parsing and signing
        }

        await Promise.all(corePlugins);

        // Register multipart plugin with performance optimizations
        if (appConfig.plugins.multipart.enabled) {
            await this.app.register(fastifyMultipart, {
                limits: appConfig.plugins.multipart.limits, // File size and field limits
                attachFieldsToBody: appConfig.plugins.multipart.attachFieldsToBody, // Prevent automatic parsing to body for better performance
                sharedSchemaId: appConfig.plugins.multipart.sharedSchemaId // Enable schema sharing for validation
            });
        }

        // Register CSRF protection
        if (appConfig.plugins.csrf.enabled) {
            await this.app.register(fastifyCsrf); // CSRF protection for state-changing operations
        }

        // Register static file serving with optimization settings
        if (appConfig.plugins.static.enabled) {
            await this.app.register(fastifyStatic, {
                root: join(__dirname, '..', appConfig.plugins.static.root), // Root directory for static files
                prefix: appConfig.plugins.static.prefix, // URL prefix for static files
                cacheControl: appConfig.plugins.static.cacheControl, // Enable Cache-Control headers
                maxAge: appConfig.plugins.static.maxAge, // Cache duration for static files
                etag: appConfig.plugins.static.etag, // Enable ETags for better caching
                lastModified: appConfig.plugins.static.lastModified, // Enable Last-Modified headers
                immutable: appConfig.plugins.static.immutable // Mark static assets as immutable for better caching
            });
        }

        // Configure rate limiting with settings from config if enabled
        if (appConfig.plugins.rateLimit.enabled) {
            const rateLimitConfig: {
                max: number;
                timeWindow: string;
                allowList: string[];
                skipOnError: boolean;
                ban?: number;
                addHeadersOnExceeding?: {
                    'x-ratelimit-limit': boolean;
                    'x-ratelimit-remaining': boolean;
                    'x-ratelimit-reset': boolean;
                };
            } = {
                max: appConfig.plugins.rateLimit.max, // Maximum requests per time window
                timeWindow: appConfig.plugins.rateLimit.timeWindow, // Time window for rate limiting
                allowList: appConfig.plugins.rateLimit.allowList, // IPs exempt from rate limiting
                skipOnError: appConfig.plugins.rateLimit.skipOnError // Don't block requests if rate limiter fails
            };

            // Add ban configuration if specified
            if (appConfig.plugins.rateLimit.ban) {
                rateLimitConfig.ban = appConfig.plugins.rateLimit.ban;
            }

            // Add rate limit headers if enabled
            if (appConfig.plugins.rateLimit.addHeaders) {
                rateLimitConfig.addHeadersOnExceeding = {
                    'x-ratelimit-limit': true,
                    'x-ratelimit-remaining': true,
                    'x-ratelimit-reset': true
                };
            }

            await this.app.register(fastifyRateLimit, rateLimitConfig);
        }

        // Compression settings
        if (appConfig.plugins.compression.enabled) {
            await this.app.register(compression, {
                encodings: appConfig.plugins.compression.encodings, // Supported compression encodings
                threshold: appConfig.plugins.compression.threshold, // Minimum response size to compress
                brotliOptions: appConfig.plugins.compression.brotliOptions, // Brotli compression options
                zlibOptions: {
                    level: appConfig.plugins.compression.zlibLevel, // Balance between compression ratio and speed
                    chunkSize: appConfig.plugins.compression.chunkSize // Chunk size for streaming compression
                },
                // Only compress specific content types for better performance
                customTypes: new RegExp(appConfig.plugins.compression.contentTypeFilter)
            });
        }
    }

    // Enable URI-based versioning using configuration
    setupVersioning() {
        this.app.setGlobalPrefix(appConfig.server.routePrefix); // API route prefix
        this.app.enableVersioning({
            type: VersioningType.URI, // Use URI-based versioning
            defaultVersion: appConfig.server.version // Default API version
        });
    }

    // Set up global guards
    setupGuards() {
        this.app.useGlobalGuards(new PayloadGuard(this.reflector)); // Global payload validation and sanitization
    }

    // Set up global error filters
    setUpFilters() {
        this.app.useGlobalFilters(new HttpExceptionFilter()); // Global exception handling
    }

    setupInterceptors() {
        if (appConfig.server.mode === 'development' && appConfig.monitoring.performance.enabled) {
            this.app.useGlobalInterceptors(new PerformanceInterceptor());
        }
    }

    // Start listening on the configured port with host binding
    async startServer() {
        const port = appConfig.server.port; // Server port from configuration
        const host = appConfig.server.host; // Server host binding from configuration

        await this.app.listen(port, host);
        const url = await this.app.getUrl();
        this.logger.log(`Application is running on: ${url}`);

        // Log additional startup information
        if (appConfig.monitoring.startup.logProcessInfo) {
            this.logger.log(`Process ID: ${process.pid}`);
            this.logger.log(`Environment: ${appConfig.server.mode}`);
            this.logger.log(`Node version: ${process.version}`);
        }
    }

    // Enable shutdown hooks for graceful cleanup
    async enableShutdownHooks() {
        this.app.enableShutdownHooks();

        // Add graceful shutdown handlers
        if (appConfig.gracefulShutdown.enabled) {
            for (const signal of appConfig.gracefulShutdown.signals) {
                process.on(signal as NodeJS.Signals, () => {
                    if (!this.isShuttingDown) {
                        this.isShuttingDown = true;
                        if (appConfig.gracefulShutdown.logShutdown) {
                            this.logger.log(`${signal} received, shutting down gracefully`);
                        }
                        this.app.close();
                    }
                });
            }
        }
    }

    // Set up the view engine using configuration
    setupViewEngine() {
        this.app.setViewEngine({
            engine: {
                [appConfig.views.engine]: require(appConfig.views.engine) // Template engine (handlebars, ejs, etc.)
            },
            templates: join(__dirname, '../..', appConfig.views.templatesDir) // Templates directory
        });
    }

    // Set up RabbitMQ microservices with error handling and configuration
    async setUpMicroservices() {
        // Only set up microservices if RabbitMQ is enabled
        if (!(appConfig.microservices.rabbitmq.enabled && appConfig.microservices.rabbitmq.consumer.enabled)) {
            return;
        }

        try {
            this.app.connectMicroservice(createRmqMicroserviceOptions(RABBIT_MQ_QUEUE_KEYS.GENERAL));
            this.app.connectMicroservice(createRmqMicroserviceOptions(RABBIT_MQ_QUEUE_KEYS.FIFO_CONSUMER));

            await this.app.startAllMicroservices();
            this.logger.log('RabbitMQ general and FIFO consumer microservices started successfully');

            // Log RabbitMQ connection info
            if (appConfig.monitoring.startup.logProcessInfo) {
                this.logger.log(`RabbitMQ connected to: ${appConfig.microservices.rabbitmq.uri}`);
                this.logger.log(
                    `Exchange: ${appConfig.microservices.rabbitmq.exchange.name} (${appConfig.microservices.rabbitmq.exchange.type})`
                );
            }
        } catch (error) {
            this.logger.error('Failed to start microservices:', error);

            // Continue without microservices if configured to do so
            if (!appConfig.microservices.rabbitmq.consumer.continueOnFailure) {
                throw error;
            }
        }
    }

    async bootstrap() {
        try {
            // Core app creation
            await this.createApp();

            // Setup hooks
            this.setupHooks();

            // Plugin setup (sequential due to dependencies)
            await this.setupPlugins();

            // Application configuration
            this.setupVersioning();
            this.setupGuards();
            this.setUpFilters();
            this.setupInterceptors();
            this.setupViewEngine();
            await this.enableShutdownHooks();

            // Start services
            await this.setUpMicroservices();
            await this.startServer();
        } catch (error) {
            this.logger.error('Failed to bootstrap application:', error);
            throw error;
        }
    }
}

(async () => {
    try {
        const app = new App();
        await app.bootstrap();
    } catch {
        process.exitCode = 1;
    }
})();
