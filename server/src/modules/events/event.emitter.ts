import { Injectable } from '@nestjs/common';
import { JobsService } from '~/integrations';

@Injectable()
export class AppEvents {
    constructor(private readonly jobsService: JobsService) {}

    async publish(routingKey: string, data: unknown, delayMs = 0) {
        return this.jobsService.publish(routingKey, data, { delayMs });
    }
}
