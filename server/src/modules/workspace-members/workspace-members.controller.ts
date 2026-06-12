import { Controller, Delete, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { RequestX } from '~/shared/types/request.type';
import { Sanitize } from '~/system';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RequireWorkspaceRoles, WorkspaceRoleGuard } from '../workspaces/workspace.guard';
import {
    InviteMemberInputType,
    inviteMemberInput,
    ListMembersInputType,
    listMembersInput,
    MemberPathInputType,
    memberPathInput,
    UpdateMemberInputType,
    updateMemberInput,
    WorkspaceMemberPathInputType,
    workspaceMemberPathInput
} from './schemas';
import { WorkspaceMembersService } from './workspace-members.service';

@Controller('workspaces/:workspaceId/members')
@UseGuards(JwtAuthGuard)
export class WorkspaceMembersController {
    constructor(private readonly workspaceMembersService: WorkspaceMembersService) {}

    @Get()
    @UseGuards(WorkspaceRoleGuard)
    @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
    @Sanitize(listMembersInput)
    async listMembers(@Req() request: RequestX<ListMembersInputType>) {
        return this.workspaceMembersService.listMembers(request.payload);
    }

    @Post()
    @UseGuards(WorkspaceRoleGuard)
    @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
    @Sanitize(inviteMemberInput)
    async inviteMember(@Req() request: RequestX<InviteMemberInputType>) {
        return this.workspaceMembersService.inviteMember(request.payload);
    }

    @Patch(':memberId')
    @UseGuards(WorkspaceRoleGuard)
    @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
    @Sanitize(updateMemberInput)
    async updateMemberRole(@Req() request: RequestX<UpdateMemberInputType>) {
        return this.workspaceMembersService.updateMemberRole(request.payload);
    }

    @Delete(':memberId')
    @UseGuards(WorkspaceRoleGuard)
    @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
    @Sanitize(memberPathInput)
    async removeMember(@Req() request: RequestX<MemberPathInputType>) {
        return this.workspaceMembersService.removeMember(request.payload);
    }

    @Post('accept')
    @HttpCode(200)
    @Sanitize(workspaceMemberPathInput)
    async acceptInvite(@Req() request: RequestX<WorkspaceMemberPathInputType>) {
        return this.workspaceMembersService.acceptInvite(request.payload);
    }

    @Post('decline')
    @HttpCode(200)
    @Sanitize(workspaceMemberPathInput)
    async declineInvite(@Req() request: RequestX<WorkspaceMemberPathInputType>) {
        return this.workspaceMembersService.declineInvite(request.payload);
    }
}
