import { Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { CacheModule, DatabaseModule, JobsModule } from '~/integrations';
import { AuthModule } from '../modules/auth/auth.module';
import { EventModule } from '../modules/events/events.module';
import { ProjectModule } from '../modules/project/project.module';
import { WorkspaceMembersModule } from '../modules/workspace-members/workspace-members.module';
import { WorkspaceModule } from '../modules/workspaces/workspace.module';

@Module({
    imports: [
        DatabaseModule,
        CacheModule,
        AuthModule,
        WorkspaceModule,
        WorkspaceMembersModule,
        ProjectModule,
        JobsModule,
        EventModule,
        ClsModule.forRoot({ global: true, middleware: { mount: true } })
    ],
    controllers: []
})
export class AppModule {}
