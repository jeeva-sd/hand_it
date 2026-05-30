import { RmqOptions, Transport } from '@nestjs/microservices';
import { appConfig } from '~/system/config';

export const RABBIT_MQ_QUEUE_KEYS = { GENERAL: 'general', FIFO_CONSUMER: 'fifoConsumer' } as const;

export type RabbitMqQueueKey = (typeof RABBIT_MQ_QUEUE_KEYS)[keyof typeof RABBIT_MQ_QUEUE_KEYS];

// Use consolidated microservices.rabbitmq configuration
const BASE_OPTIONS = {
    urls: [appConfig.microservices.rabbitmq.uri],
    exchange: appConfig.microservices.rabbitmq.exchange.name,
    exchangeType: appConfig.microservices.rabbitmq.exchange.type,
    exchangeArguments: appConfig.microservices.rabbitmq.exchange.options.arguments,
    queueOptions: { durable: true }
};

function getQueueConfig(queueKey: RabbitMqQueueKey) {
    const queueConfig = appConfig.microservices.rabbitmq.queues[queueKey];

    if (!queueConfig) {
        throw new Error(`Queue config for key '${queueKey}' not found`);
    }

    return queueConfig;
}

// For microservices: allow ack/nack
export function buildRmqMicroserviceOptions(queueKey: RabbitMqQueueKey): RmqOptions['options'] {
    const queueConfig = getQueueConfig(queueKey);

    return {
        ...BASE_OPTIONS,
        queue: queueConfig.name,
        prefetchCount: queueConfig.prefetchCount,
        noAck: false, // Required for ack/nack logic
        queueOptions: { durable: queueConfig.durable }
    };
}

export function createRmqMicroserviceOptions(queueKey: RabbitMqQueueKey): RmqOptions {
    const options: RmqOptions = {
        transport: Transport.RMQ,
        options: buildRmqMicroserviceOptions(queueKey) // Use microservice-specific config
    };

    return options;
}

export function extractRoutingKeys(eventMap: Record<string, unknown>): string[] {
    const keys = new Set<string>();

    function recurse(obj: Record<string, unknown>) {
        for (const value of Object.values(obj)) {
            if (typeof value === 'string') {
                keys.add(value);
            } else if (typeof value === 'object' && value !== null) {
                recurse(value as Record<string, unknown>);
            }
        }
    }

    recurse(eventMap);
    return [...keys];
}
