import { Module } from '@nestjs/common';
import { JobsService } from './job.service';

@Module({ providers: [JobsService], exports: [JobsService] })
export class JobsModule {}
