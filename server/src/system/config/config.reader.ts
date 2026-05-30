import * as fs from 'node:fs';
import * as path from 'node:path';
import { Logger } from '@nestjs/common';
import { z } from 'zod';
import { AppConfig, AppConfigRule } from './config.schema';

export class ConfigReader {
    private static instance: ConfigReader;
    private readonly logger = new Logger(ConfigReader.name);
    public config: AppConfig;
    private static readonly configCache = new Map<string, Partial<AppConfig>>();

    private constructor() {
        const env = process.env.NODE_ENV;

        if (!env) {
            throw new Error('NODE_ENV is required to load configuration');
        }

        try {
            // Use cached config if available (for testing/hot reload scenarios)
            const cacheKey = `${env}_config`;
            if (ConfigReader.configCache.has(cacheKey)) {
                this.config = ConfigReader.configCache.get(cacheKey) as AppConfig;
                return;
            }

            // Construct absolute paths to the JSON configuration files
            const basePath = path.resolve(process.cwd(), 'envs/base.json');
            const envPath = path.resolve(process.cwd(), `envs/${env}.json`);

            // Read configurations in parallel
            const [baseConfig, envConfig] = this.readConfigFilesParallel(basePath, envPath);

            // Merge the base and environment configurations
            const mergedConfigs = this.mergeConfigs(baseConfig, envConfig);

            // Validate and initialize the configuration
            this.config = this.applyValidation(mergedConfigs as AppConfig);

            // Cache the validated config
            ConfigReader.configCache.set(cacheKey, this.config);

            this.logger.log('Configuration loaded successfully');
        } catch (error) {
            const errorMsg =
                typeof error === 'object' && error !== null && 'message' in error
                    ? (error as { message: string }).message
                    : String(error);
            this.logger.error(`Failed to load configuration: ${errorMsg}`);
            throw error;
        }
    }

    public static getInstance(): ConfigReader {
        if (!ConfigReader.instance) {
            ConfigReader.instance = new ConfigReader();
        }
        return ConfigReader.instance;
    }

    private readConfigFilesParallel(basePath: string, envPath: string): [Partial<AppConfig>, Partial<AppConfig>] {
        try {
            const baseExists = fs.existsSync(basePath);
            const envExists = fs.existsSync(envPath);

            if (!baseExists) {
                throw new Error(`Base configuration file not found: ${basePath}`);
            }
            if (!envExists) {
                throw new Error(`Environment configuration file not found: ${envPath}`);
            }

            const baseConfig = JSON.parse(fs.readFileSync(basePath, 'utf8'));
            const envConfig = JSON.parse(fs.readFileSync(envPath, 'utf8'));

            return [baseConfig, envConfig];
        } catch (error) {
            this.logger.error('Error reading configuration files');
            throw error;
        }
    }

    private mergeConfigs(baseConfig: Partial<AppConfig>, envConfig: Partial<AppConfig>): Partial<AppConfig> {
        const mergeRecords = (
            base: Record<string, unknown>,
            overlay: Record<string, unknown>
        ): Record<string, unknown> => {
            const merged: Record<string, unknown> = { ...base };

            for (const [key, value] of Object.entries(overlay)) {
                const baseValue = merged[key];

                if (
                    value !== null &&
                    typeof value === 'object' &&
                    !Array.isArray(value) &&
                    baseValue !== null &&
                    typeof baseValue === 'object' &&
                    !Array.isArray(baseValue)
                ) {
                    merged[key] = mergeRecords(baseValue as Record<string, unknown>, value as Record<string, unknown>);
                } else {
                    merged[key] = value;
                }
            }

            return merged;
        };

        return mergeRecords(
            baseConfig as Record<string, unknown>,
            envConfig as Record<string, unknown>
        ) as Partial<AppConfig>;
    }

    private applyValidation(mergedConfigs: AppConfig): AppConfig {
        try {
            return AppConfigRule.parse(mergedConfigs);
        } catch (e) {
            if (e instanceof z.ZodError) {
                this.logger.error(`Configuration validation failed:\n${z.prettifyError(e)}`);
            } else {
                this.logger.error(`Configuration validation failed: ${e instanceof Error ? e.message : String(e)}`);
            }
            throw e;
        }
    }

    public get<K extends keyof AppConfig>(key: K): AppConfig[K] {
        return this.config[key];
    }

    public getAll(): AppConfig {
        return this.config;
    }

    public static clearCache(): void {
        ConfigReader.configCache.clear();
    }
}
