import { Controller, Delete, Get, HttpCode, Patch, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { WorkspaceRole } from '@prisma/client';
import { FastifyReply } from 'fastify';
import { RequestX } from '~/shared/types/request.type';
import { Public, Sanitize } from '~/system';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import {
    createWorkspaceInput,
    listWorkspaceInput,
    updateWorkspaceInput,
    uploadLogoInput,
    workspacePathInput
} from './schemas';
import { RequireWorkspaceRoles, WorkspaceRoleGuard } from './workspace.guard';
import { WorkspaceService } from './workspace.service';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
    constructor(private readonly workspaceService: WorkspaceService) {}

    @Get()
    @Sanitize(listWorkspaceInput)
    async listWorkspaces(@Req() request: RequestX<listWorkspaceInput>) {
        return this.workspaceService.listWorkspaces(request.payload);
    }

    @Post()
    @Sanitize(createWorkspaceInput)
    async createWorkspace(@Req() request: RequestX<createWorkspaceInput>) {
        return this.workspaceService.createWorkspace(request.payload);
    }

    @Get(':workspaceId')
    @Sanitize(workspacePathInput)
    async getWorkspace(@Req() request: RequestX<workspacePathInput>) {
        return this.workspaceService.getWorkspace(request.payload);
    }

    @HttpCode(200)
    @Post(':workspaceId/select')
    @Sanitize(workspacePathInput)
    async selectWorkspace(@Req() request: RequestX<workspacePathInput>) {
        return this.workspaceService.selectWorkspace(request.payload);
    }

    @Patch(':workspaceId')
    @UseGuards(WorkspaceRoleGuard)
    @Sanitize(updateWorkspaceInput)
    @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
    async updateWorkspace(@Req() request: RequestX<updateWorkspaceInput>) {
        return this.workspaceService.updateWorkspace(request.payload);
    }

    @Delete(':workspaceId')
    @UseGuards(WorkspaceRoleGuard)
    @Sanitize(workspacePathInput)
    @RequireWorkspaceRoles(WorkspaceRole.OWNER)
    async deleteWorkspace(@Req() request: RequestX<workspacePathInput>) {
        return this.workspaceService.deleteWorkspace(request.payload);
    }

    @Put(':workspaceId/logo')
    @UseGuards(WorkspaceRoleGuard)
    @RequireWorkspaceRoles(WorkspaceRole.OWNER, WorkspaceRole.ADMIN)
    @Sanitize(uploadLogoInput)
    async uploadLogo(@Req() request: RequestX<uploadLogoInput>) {
        return this.workspaceService.uploadLogo(request.payload);
    }

    @Get(':workspaceId/logo')
    @Public()
    @Sanitize(workspacePathInput)
    async getLogo(@Req() request: RequestX<workspacePathInput>, @Res() res: FastifyReply) {
        const { workspaceId } = request.payload;
        const { stream, contentType } = await this.workspaceService.getLogo(workspaceId);

        res.header('Content-Type', contentType);
        res.header('Cache-Control', 'public, max-age=604800'); // Cache for 7 days
        res.send(stream);
    }
}
