import { Controller, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RequestX } from '~/shared/types/request.type';
import { Sanitize } from '~/system';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import {
    CreateWorkspacePayload,
    createWorkspaceSchema,
    UpdateWorkspacePayload,
    updateWorkspaceSchema,
    WorkspacePathPayload,
    workspacePathSchema
} from './schemas';
import { WorkspaceService } from './workspace.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
    constructor(private readonly workspaceService: WorkspaceService) {}

    @Get()
    @HttpCode(200)
    async listWorkspaces(@Req() request: RequestX<unknown>) {
        return this.workspaceService.listWorkspaces(request.user);
    }

    @Post()
    @HttpCode(201)
    @Sanitize(createWorkspaceSchema)
    async createWorkspace(@Req() request: RequestX<CreateWorkspacePayload>) {
        return this.workspaceService.createWorkspace(request.payload, request.user);
    }

    @Get(':workspaceId')
    @HttpCode(200)
    @Sanitize(workspacePathSchema)
    async getWorkspace(@Req() request: RequestX<WorkspacePathPayload>) {
        return this.workspaceService.getWorkspace(request.payload, request.user);
    }

    @Patch(':workspaceId')
    @HttpCode(200)
    @Sanitize(updateWorkspaceSchema)
    async updateWorkspace(@Req() request: RequestX<UpdateWorkspacePayload>) {
        return this.workspaceService.updateWorkspace(request.payload, request.user);
    }
}
