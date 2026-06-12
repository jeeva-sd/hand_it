import { Module } from '@nestjs/common';
import { DatabaseModule } from '~/integrations';
import { StrategyModule } from '../auth/strategies/strategy.module';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { WorkspaceInvitationService } from './workspace-invitation.service';
import { WorkspaceMembersController } from './workspace-members.controller';
import { WorkspaceMembersRepository } from './workspace-members.repository';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceMembersCacheService } from './workspace-members-cache.service';

@Module({
    imports: [StrategyModule, DatabaseModule, WorkspaceModule],
    controllers: [WorkspaceMembersController],
    providers: [
        WorkspaceMembersService,
        WorkspaceMembersRepository,
        WorkspaceMembersCacheService,
        WorkspaceInvitationService
    ],
    exports: [WorkspaceMembersService, WorkspaceInvitationService]
})
export class WorkspaceMembersModule {}
