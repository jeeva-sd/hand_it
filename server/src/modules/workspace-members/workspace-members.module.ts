import { Module } from '@nestjs/common';
import { DatabaseModule, EmailsModule } from '~/integrations';
import { StrategyModule } from '../auth/strategies/strategy.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { WorkspaceMembersController } from './workspace-members.controller';
import { InviteController } from './invite.controller';
import { WorkspaceMembersRepository } from './workspace-members.repository';
import { WorkspaceMembersService } from './workspace-members.service';
import { WorkspaceInvitationService } from './workspace-invitation.service';
import { WorkspaceMembersCacheService } from './workspace-members-cache.service';

@Module({
    imports: [StrategyModule, DatabaseModule, WorkspaceModule, EmailsModule, AuthModule],
    controllers: [WorkspaceMembersController, InviteController],
    providers: [
        WorkspaceMembersService,
        WorkspaceInvitationService,
        WorkspaceMembersRepository,
        WorkspaceMembersCacheService
    ],
    exports: [WorkspaceMembersService, WorkspaceInvitationService]
})
export class WorkspaceMembersModule {}

