import { Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { ZodType } from 'zod';

const logger = new Logger('RMQDecorator');

function resolveRmqContext(args: unknown[]): { context: RmqContext | null; contextIndex: number } {
    const lastIndex = args.length - 1;
    if (lastIndex >= 0 && args[lastIndex] instanceof RmqContext) {
        return { context: args[lastIndex] as RmqContext, contextIndex: lastIndex };
    }

    const contextIndex = args.findIndex(arg => arg instanceof RmqContext);
    return { context: contextIndex === -1 ? null : (args[contextIndex] as RmqContext), contextIndex };
}

function resolvePayloadIndex(args: unknown[], contextIndex: number): number {
    // Fast path for common signature: handler(@Payload() payload, @Ctx() context)
    const primaryIndex = contextIndex === 0 ? 1 : 0;
    if (primaryIndex >= 0 && primaryIndex < args.length && !(args[primaryIndex] instanceof RmqContext)) {
        return primaryIndex;
    }

    // Fallback to first non-context argument for non-standard signatures.
    return args.findIndex((arg, index) => index !== contextIndex && !(arg instanceof RmqContext));
}

function extractPayloadFromMessageContent(message: { content: Buffer }): unknown {
    const parsed = JSON.parse(message.content.toString());
    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
        return (parsed as { data: unknown }).data;
    }

    return parsed;
}

export function AckHandler(schema?: ZodType<unknown>) {
    return (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: unknown[]) {
            const { context, contextIndex } = resolveRmqContext(args);

            if (!context) {
                throw new Error('RmqContext not found in arguments.');
            }

            const channel = context.getChannelRef();
            const message = context.getMessage();

            try {
                const payloadIndex = resolvePayloadIndex(args, contextIndex);

                if (payloadIndex === -1) {
                    logger.warn(`Payload argument not found in ${propertyKey}`);
                    channel.nack(message, false, false);
                    return null;
                }

                let rawPayload = args[payloadIndex];

                // Handle case where payload might be undefined or null
                if (rawPayload === undefined || rawPayload === null) {
                    logger.warn(
                        `Payload is ${rawPayload} in ${propertyKey}, attempting to extract from message content`
                    );

                    // Try to extract payload from the raw message content
                    try {
                        rawPayload = extractPayloadFromMessageContent(message as { content: Buffer });
                        args[payloadIndex] = rawPayload;
                    } catch (_parseError) {
                        logger.error(`Failed to parse message content in ${propertyKey}`);
                        channel.nack(message, false, false);
                        return null;
                    }
                }

                // If payload is still not a valid object after extraction, reject the message
                if (typeof rawPayload !== 'object' || rawPayload === null) {
                    logger.warn(`Invalid payload type in ${propertyKey}: ${typeof rawPayload}`);
                    channel.nack(message, false, false);
                    return null;
                }

                if (schema) {
                    try {
                        const parsedPayload = schema.parse(rawPayload);

                        // replace payload with parsed data
                        args[payloadIndex] = parsedPayload;
                    } catch (validationError) {
                        const zodError = validationError as { errors?: { message?: string }[]; message?: string };

                        logger.warn(
                            `Validation failed in ${propertyKey}: ${zodError.errors?.[0]?.message || zodError.message}`
                        );

                        channel.nack(message, false, false); // discard invalid message
                        return null;
                    }
                }

                const result = await originalMethod.apply(this, args);

                if (result === null) {
                    channel.nack(message, false, false);
                    return null;
                }

                channel.ack(message);
                return result;
            } catch (error) {
                const err = error as Error;
                logger.error(`Error in ${propertyKey}: ${err.message}`, err.stack);
                channel.nack(message, false, false); // discard message on error
                return null;
            }
        };

        return descriptor;
    };
}
