import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { CacheModule, DatabaseModule, JobsModule } from '~/integrations';
import { AuthModule } from '../modules/auth/auth.module';
import { EventModule } from '../modules/events/events.module';
import { ProjectModule } from '../modules/project/project.module';
import { WorkspaceModule } from '../modules/workspace/workspace.module';

@Module({
    imports: [
        DatabaseModule,
        CacheModule,
        AuthModule,
        WorkspaceModule,
        ProjectModule,
        JobsModule,
        EventModule,
        ClsModule.forRoot({ global: true, middleware: { mount: true } })
    ],
    controllers: []
})
export class AppModule {}
