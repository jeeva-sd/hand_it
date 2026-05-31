import { Module } from '@nestjs/common';
import { DatabaseModule } from '~/integrations';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { StrategyModule } from '../auth/strategies/strategy.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceRepository } from './workspace.repository';
import { WorkspaceService } from './workspace.service';

@Module({
    imports: [StrategyModule, DatabaseModule],
    controllers: [WorkspaceController],
    providers: [WorkspaceService, WorkspaceRepository, JwtAuthGuard]
})
export class WorkspaceModule {}
