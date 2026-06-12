import { Module } from '@nestjs/common';
import { DatabaseModule } from '~/integrations';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { StrategyModule } from '../auth/strategies/strategy.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceRoleGuard } from './workspace.guard';
import { WorkspaceRepository } from './workspace.repository';
import { WorkspaceService } from './workspace.service';
import { WorkspaceAccessService } from './workspace-access.service';
import { WorkspaceCacheService } from './workspace-cache.service';

@Module({
    imports: [StrategyModule, DatabaseModule],
    controllers: [WorkspaceController],
    providers: [
        WorkspaceService,
        WorkspaceRepository,
        WorkspaceCacheService,
        WorkspaceAccessService,
        JwtAuthGuard,
        WorkspaceRoleGuard
    ],
    exports: [WorkspaceCacheService, WorkspaceAccessService, WorkspaceRoleGuard]
})
export class WorkspaceModule {}
