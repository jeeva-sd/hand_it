import { BeforeApplicationShutdown, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { appConfig } from '~/system/config';

const { sql } = appConfig.database;

if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `mysql://${sql.username}:${sql.password}@${sql.host}:${sql.port}/${sql.database}?connection_limit=${sql.connectionLimit}&pool_timeout=${sql.performance.poolTimeout}&connect_timeout=${sql.performance.connectTimeout}&max_idle_connection_lifetime=${sql.performance.idleTimeout}`;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, BeforeApplicationShutdown, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    async onModuleInit() {
        this.logger.log('Connecting to the database...');
        await this.$connect();
        this.logger.log('Database connection established.');
    }

    async beforeApplicationShutdown() {
        await this.disconnect();
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    private async disconnect() {
        try {
            await this.$disconnect();
        } catch {}
    }
}
