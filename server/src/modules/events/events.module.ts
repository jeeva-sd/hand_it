import { Module } from '@nestjs/common';
import { JobsModule } from '~/integrations';
import { EventConsumer } from './event.consumer';
import { AppEvents } from './event.emitter';

@Module({ imports: [JobsModule], controllers: [EventConsumer], providers: [AppEvents], exports: [AppEvents] })
export class EventModule {}
