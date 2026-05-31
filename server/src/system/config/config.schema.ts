import * as z from 'zod';

const serverConfigSchema = z.object({
    appId: z.number(),
    port: z.number(),
    routePrefix: z.string(),
    version: z.coerce.string(),
    mode: z.enum(['development', 'production']),
    host: z.string(),
    allowExceptionLogs: z.boolean(),
    bufferLogs: z.boolean(),
    abortOnError: z.boolean()
});

// Fastify adapter configuration schema
const fastifyConfigSchema = z.object({
    adapter: z.object({
        logger: z.boolean(),
        trustProxy: z.boolean(),
        ignoreTrailingSlash: z.boolean(),
        ignoreDuplicateSlashes: z.boolean(),
        caseSensitive: z.boolean(),
        maxParamLength: z.number(),
        bodyLimit: z.number()
    }),
    hooks: z.object({
        performanceLogging: z.boolean(),
        slowRequestThreshold: z.number(),
        enableRequestTiming: z.boolean()
    })
});

const pluginsConfigSchema = z.object({
    helmet: z.object({ enabled: z.boolean() }),
    cors: z.object({
        enabled: z.boolean(),
        origin: z.array(z.string().trim()),
        originPatterns: z.array(z.string().trim()).optional().default([]),
        credentials: z.boolean(),
        methods: z.array(z.string().trim())
    }),
    cookies: z.object({ enabled: z.boolean() }),
    multipart: z.object({
        enabled: z.boolean(),
        tempUploadDir: z.string().trim().min(1),
        attachFieldsToBody: z.boolean(),
        sharedSchemaId: z.string(),
        limits: z.object({ fileSize: z.number(), fieldSize: z.number(), fields: z.number(), files: z.number() })
    }),
    csrf: z.object({ enabled: z.boolean() }),
    static: z.object({
        enabled: z.boolean(),
        root: z.string(),
        prefix: z.string(),
        maxAge: z.number().min(0, 'Max age must be a non-negative number'),
        etag: z.boolean(),
        lastModified: z.boolean(),
        immutable: z.boolean(),
        cacheControl: z.boolean()
    }),
    rateLimit: z.object({
        enabled: z.boolean(),
        max: z.number().int().positive(),
        timeWindow: z.string(),
        allowList: z.array(z.string()),
        ban: z.number().int().nonnegative().optional(),
        skipOnError: z.boolean(),
        addHeaders: z.boolean()
    }),
    compression: z.object({
        enabled: z.boolean(),
        encodings: z.array(z.enum(['gzip', 'deflate', 'br'])),
        threshold: z.number().min(0),
        zlibLevel: z.number(),
        chunkSize: z.number(),
        contentTypeFilter: z.string(),
        brotliOptions: z.object({ params: z.object({ BROTLI_PARAM_QUALITY: z.number().min(0).max(11) }) })
    })
});

const payloadConfigSchema = z.object({
    abortEarly: z.boolean(),
    stripUnknown: z.boolean(),
    recursive: z.boolean(),
    decoratorKey: z.string()
});

const googleAuthConfigSchema = z
    .object({
        enabled: z.boolean().default(false),
        clientId: z.string().trim().default(''),
        clientSecret: z.string().trim().default(''),
        redirectUri: z.string().trim().default(''),
        scopes: z.array(z.string().trim().min(1)).default(['openid', 'email', 'profile']),
        authorizationUrl: z.string().url().default('https://accounts.google.com/o/oauth2/v2/auth'),
        tokenUrl: z.string().url().default('https://oauth2.googleapis.com/token'),
        userInfoUrl: z.string().url().default('https://openidconnect.googleapis.com/v1/userinfo'),
        successRedirectPath: z.string().trim().min(1).default('/projects'),
        failureRedirectPath: z.string().trim().min(1).default('/auth/login')
    })
    .superRefine((value, ctx) => {
        if (!value.enabled) {
            return;
        }

        if (!value.clientId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['clientId'],
                message: 'Google auth clientId is required when Google auth is enabled'
            });
        }

        if (!value.clientSecret) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['clientSecret'],
                message: 'Google auth clientSecret is required when Google auth is enabled'
            });
        }

        if (!value.redirectUri) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['redirectUri'],
                message: 'Google auth redirectUri is required when Google auth is enabled'
            });
            return;
        }

        const redirectUriCheck = z.string().url();
        const parsedRedirectUri = redirectUriCheck.safeParse(value.redirectUri);

        if (!parsedRedirectUri.success) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['redirectUri'],
                message: 'Google auth redirectUri must be a valid URL'
            });
        }
    });

const authConfigSchema = z.object({
    publicAuthKey: z.string(),
    skipJwtAuthKey: z.string(),
    encryptionKey: z.string(),
    roleKey: z.string(),
    permissionKey: z.string(),
    tokenCookieNames: z.array(z.string().trim().min(1)).default(['handit_auth_token']),
    basicJWT: z.object({ name: z.string(), secret: z.string(), expiresIn: z.number() }),
    // Optional secondary JWT block for future token flavors.
    secondaryJWT: z.object({ name: z.string(), secret: z.string(), expiresIn: z.number() }).optional(),
    google: googleAuthConfigSchema.default({
        enabled: false,
        clientId: '',
        clientSecret: '',
        redirectUri: '',
        scopes: ['openid', 'email', 'profile'],
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
        successRedirectPath: '/projects',
        failureRedirectPath: '/auth/login'
    })
});

export const viewEngineSchema = z.object({
    engine: z.enum(['handlebars', 'ejs', 'pug', 'eta']),
    templatesDir: z.string()
});

// -------------------------------------------- Database --------------------------------------------

const sqlRule = z.object({
    host: z.string(),
    port: z.number().min(1).max(65_535),
    username: z.string().min(1),
    password: z.string().min(1),
    database: z.string().min(1),
    connectionLimit: z.number(),
    allowSeed: z.boolean(),
    performance: z.object({ poolTimeout: z.number(), connectTimeout: z.number(), idleTimeout: z.number() })
});

const databaseRule = z.object({ sql: sqlRule });

const rabbitMqQueueSchema = z.object({
    name: z.string().min(1),
    prefetchCount: z
        .number()
        .int({ message: 'prefetchCount must be an integer' })
        .positive({ message: 'prefetchCount must be positive' }),
    durable: z.boolean()
});

// Microservices configuration schema with consolidated RabbitMQ config
const microservicesConfigSchema = z.object({
    rabbitmq: z.object({
        enabled: z.boolean(),
        producer: z.object({
            enabled: z.boolean(),
            maxReconnectAttempts: z.number().int().positive().default(10),
            baseReconnectDelayMs: z.number().int().positive().default(1000),
            confirmChannel: z.boolean().default(true)
        }),
        consumer: z.object({ enabled: z.boolean(), continueOnFailure: z.boolean() }),
        uri: z
            .string()
            .min(1, { message: 'RabbitMQ URI is required' })
            .regex(/^amqp(s)?:\/\/.+/, { message: 'Invalid AMQP URI format' }),
        exchange: z.object({
            name: z.string().min(1, { message: 'Exchange name is required' }),
            type: z.string().min(1, { message: 'Exchange type is required' }),
            options: z.object({
                arguments: z.object({ 'x-delayed-type': z.string().min(1, { message: 'x-delayed-type is required' }) })
            })
        }),
        queues: z.object({ general: rabbitMqQueueSchema, fifoConsumer: rabbitMqQueueSchema })
    })
});

// Monitoring configuration schemas
const monitoringConfigSchema = z.object({
    performance: z.object({
        enabled: z.boolean(),
        slowRequestThreshold: z.number(),
        mediumRequestThreshold: z.number(),
        fastRequestThreshold: z.number()
    }),
    memory: z.object({
        enabled: z.boolean(),
        warningThreshold: z.number(),
        criticalThreshold: z.number(),
        checkInterval: z.number()
    }),
    startup: z.object({ logProcessInfo: z.boolean() })
});

// Graceful shutdown configuration schema
const gracefulShutdownConfigSchema = z.object({
    enabled: z.boolean(),
    signals: z.array(z.string()),
    logShutdown: z.boolean()
});

const emailConfigSchema = z
    .object({
        host: z.string().trim().min(1, 'SMTP host is required'),
        port: z.number().int().min(1).max(65_535),
        secure: z.boolean(),
        auth: z.object({
            user: z.string().trim().min(1, 'SMTP username is required'),
            pass: z.string().trim().min(1, 'SMTP password is required')
        }),
        from: z.string().trim().min(1, 'Sender name or email is required'),
        enabled: z.boolean().default(true)
    })
    .optional();

export const clientSchema = z.object({ url: z.string().url('Client URL must be a valid URL') });
export const backendSchema = z.object({ url: z.string().url('Backend URL must be a valid URL') });

// ----------------------------------------------------------------------------------------------------------

export const AppConfigRule = z.object({
    server: serverConfigSchema,
    fastify: fastifyConfigSchema,
    plugins: pluginsConfigSchema,
    microservices: microservicesConfigSchema,
    monitoring: monitoringConfigSchema,
    gracefulShutdown: gracefulShutdownConfigSchema,
    auth: authConfigSchema,
    payloadValidation: payloadConfigSchema,
    views: viewEngineSchema,
    database: databaseRule,
    email: emailConfigSchema,
    client: clientSchema,
    backend: backendSchema
});

// ------------------------------------------------------------------------------------------------------------------

export type AppConfig = z.infer<typeof AppConfigRule>;

// ------------------------------------------------------------------------------------------------------------------
