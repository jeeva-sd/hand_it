import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { fifoConsumerEvents, generalEvents } from '~/modules/events/event.patterns';
import { appConfig } from '~/system/config';
import { extractRoutingKeys } from './job.helper';

@Injectable()
export class JobsService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(JobsService.name);
    private readonly rabbit = appConfig.microservices.rabbitmq;
    private readonly producerConfig = appConfig.microservices.rabbitmq.producer;
    private readonly generalRoutingKeys = extractRoutingKeys(generalEvents);
    private readonly fifoConsumerRoutingKeys = extractRoutingKeys(fifoConsumerEvents);

    private connection: amqp.ChannelModel | null = null;
    private channel: amqp.ConfirmChannel | null = null;
    private reconnecting = false;
    private setupInProgress = false;
    private initialized = false;
    private isShuttingDown = false;
    private reconnectTimeout: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;

    async onModuleInit() {
        if (!(this.rabbit.enabled && this.producerConfig.enabled)) {
            this.logger.log('RabbitMQ producer is disabled');
            return;
        }

        await this.initializeChannel();
        await this.setupQueuesAndBindings();
    }

    async onModuleDestroy() {
        this.isShuttingDown = true;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        await this.closeChannel();
    }

    private async initializeChannel(): Promise<void> {
        if (this.channel && this.connection) {
            return;
        }

        try {
            const connection = await amqp.connect(this.rabbit.uri);
            const channel = await connection.createConfirmChannel();

            this.connection = connection;
            this.channel = channel;

            this.removeEventListeners();

            connection.on('error', async (error: Error) => {
                if (!this.isShuttingDown) {
                    this.logger.error('RabbitMQ connection error', error);
                    await this.reconnect();
                }
            });

            connection.on('close', async () => {
                if (!this.isShuttingDown) {
                    this.logger.warn('RabbitMQ connection closed');
                    await this.reconnect();
                }
            });

            channel.on('error', async (error: Error) => {
                if (!this.isShuttingDown) {
                    this.logger.error('RabbitMQ channel error', error);
                    await this.reconnect();
                }
            });

            channel.on('close', () => {
                if (!this.isShuttingDown) {
                    this.logger.warn('RabbitMQ channel closed');
                }
            });

            this.reconnectAttempts = 0;
            this.logger.log('RabbitMQ producer channel initialized');
        } catch (error) {
            this.logger.error('Failed to initialize RabbitMQ producer channel', error as Error);
            await this.reconnect();
        }
    }

    private async setupQueuesAndBindings(): Promise<void> {
        if (this.setupInProgress || this.initialized) {
            return;
        }

        this.setupInProgress = true;

        try {
            const channel = await this.ensureChannel();
            const { exchange, queues } = this.rabbit;

            await channel.assertExchange(exchange.name, exchange.type, {
                durable: true,
                arguments: exchange.options.arguments
            });

            await channel.assertQueue(queues.general.name, { durable: queues.general.durable });
            await channel.assertQueue(queues.fifoConsumer.name, { durable: queues.fifoConsumer.durable });

            for (const routingKey of this.generalRoutingKeys) {
                await channel.bindQueue(queues.general.name, exchange.name, routingKey);
            }

            for (const routingKey of this.fifoConsumerRoutingKeys) {
                await channel.bindQueue(queues.fifoConsumer.name, exchange.name, routingKey);
            }

            this.initialized = true;
            this.logger.log('RabbitMQ topology ensured for producer');
        } catch (error) {
            this.logger.error('Failed to setup RabbitMQ topology', error as Error);
            await this.reconnect();
        } finally {
            this.setupInProgress = false;
        }
    }

    private async reconnect(): Promise<void> {
        if (this.reconnecting || this.isShuttingDown) {
            return;
        }

        if (this.reconnectAttempts >= this.producerConfig.maxReconnectAttempts) {
            this.logger.error(`Reached max RabbitMQ reconnect attempts (${this.producerConfig.maxReconnectAttempts})`);
            return;
        }

        this.reconnecting = true;
        this.reconnectAttempts += 1;
        this.initialized = false;

        this.removeEventListeners();
        this.channel = null;
        this.connection = null;

        const delayMs = Math.min(this.producerConfig.baseReconnectDelayMs * 2 ** (this.reconnectAttempts - 1), 30000);

        try {
            await new Promise<void>(resolve => {
                this.reconnectTimeout = setTimeout(resolve, delayMs);
            });

            if (this.isShuttingDown) {
                return;
            }

            await this.initializeChannel();
            await this.setupQueuesAndBindings();
        } catch (error) {
            this.logger.error('RabbitMQ reconnect failed', error as Error);
        } finally {
            this.reconnecting = false;
            this.reconnectTimeout = null;
        }
    }

    private removeEventListeners(): void {
        if (this.connection) {
            this.connection.removeAllListeners('error');
            this.connection.removeAllListeners('close');
        }

        if (this.channel) {
            this.channel.removeAllListeners('error');
            this.channel.removeAllListeners('close');
        }
    }

    private async closeChannel(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }

            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }

            this.initialized = false;
        } catch (error) {
            this.logger.error('Failed to close RabbitMQ producer channel', error as Error);
        }
    }

    private async ensureChannel(): Promise<amqp.ConfirmChannel> {
        if (!(this.channel && this.connection)) {
            await this.initializeChannel();
        }

        if (!this.channel) {
            throw new Error('RabbitMQ producer channel is not initialized');
        }

        return this.channel;
    }

    async publish(
        routingKey: string,
        data: unknown,
        options?: { delayMs?: number; persistent?: boolean }
    ): Promise<boolean> {
        if (!(this.rabbit.enabled && this.producerConfig.enabled)) {
            return false;
        }

        const channel = await this.ensureChannel();
        const payload = { pattern: routingKey, data };

        const publishOptions: amqp.Options.Publish = {
            contentType: 'application/json',
            persistent: options?.persistent ?? true
        };

        if (options?.delayMs !== undefined) {
            publishOptions.headers = { 'x-delay': options.delayMs };
        }

        const payloadBuffer = Buffer.from(JSON.stringify(payload));

        let accepted = true;
        const confirmPromise = new Promise<void>((resolve, reject) => {
            accepted = channel.publish(
                this.rabbit.exchange.name,
                routingKey,
                payloadBuffer,
                publishOptions,
                (error?: Error | null) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    resolve();
                }
            );
        });

        if (!accepted) {
            await new Promise<void>(resolve => {
                channel.once('drain', () => resolve());
            });
        }

        await confirmPromise;
        return accepted;
    }

    isHealthy(): boolean {
        return this.channel !== null && this.connection !== null && !this.reconnecting && this.initialized;
    }
}
