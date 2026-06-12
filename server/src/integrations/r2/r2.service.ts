import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { appConfig } from '~/system/config';

@Injectable()
export class R2Service {
    private readonly client: S3Client;
    private readonly bucket: string;
    private readonly logger = new Logger(R2Service.name);

    constructor() {
        const { accountId, accessKeyId, secretAccessKey, bucket } = appConfig.r2;
        this.bucket = bucket;

        this.client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey }
        });
    }

    async uploadFile(key: string, body: Buffer, contentType: string): Promise<void> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: contentType
            });

            await this.client.send(command);
        } catch (error) {
            this.logger.error(`Failed to upload file to R2: ${key}`, error);
            throw error;
        }
    }

    async downloadFile(key: string) {
        try {
            const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });

            return await this.client.send(command);
        } catch (error) {
            this.logger.error(`Failed to download file from R2: ${key}`, error);
            throw error;
        }
    }
}
