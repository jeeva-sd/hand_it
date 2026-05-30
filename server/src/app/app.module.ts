import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { CacheModule, DatabaseModule, JobsModule } from '~/integrations';
import { AuthModule } from '../modules/auth/auth.module';
import { EventModule } from '../modules/events/events.module';

@Module({
    imports: [
        DatabaseModule,
        CacheModule,
        AuthModule,
        JobsModule,
        EventModule,
        ClsModule.forRoot({ global: true, middleware: { mount: true } })
    ],
    controllers: []
})
export class AppModule {}
