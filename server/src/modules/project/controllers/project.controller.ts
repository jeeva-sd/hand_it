import { Controller, Delete, Get, HttpCode, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RequestX } from '~/shared/types/request.type';
import { Sanitize } from '~/system';
import { JwtAuthGuard } from '../../auth/strategies/jwt-auth.guard';
import { ProjectAction, ProjectActionGuard, RequireAction } from '../guards/project-action.guard';
import {
    CreateProjectPayload,
    createProjectSchema,
    ProjectPathPayload,
    ProjectQueryPayload,
    projectPathSchema,
    projectQuerySchema,
    UpdateProjectPayload,
    updateProjectSchema
} from '../schemas';
import { ProjectService } from '../services/project.service';

@Controller('workspaces/:workspaceId/projects')
@UseGuards(JwtAuthGuard, ProjectActionGuard)
export class ProjectController {
    constructor(private readonly projectService: ProjectService) {}

    @Get()
    @HttpCode(200)
    @RequireAction(ProjectAction.VIEW)
    @Sanitize(projectQuerySchema)
    async listProjects(@Req() request: RequestX<ProjectQueryPayload>) {
        return this.projectService.listProjects(request.payload, request.user);
    }

    @Post()
    @HttpCode(201)
    @RequireAction(ProjectAction.CREATE)
    @Sanitize(createProjectSchema)
    async createProject(@Req() request: RequestX<CreateProjectPayload>) {
        return this.projectService.createProject(request.payload, request.user);
    }

    @Get(':projectId')
    @HttpCode(200)
    @RequireAction(ProjectAction.VIEW)
    @Sanitize(projectPathSchema)
    async getProject(@Req() request: RequestX<ProjectPathPayload>) {
        return this.projectService.getProject(request.payload, request.user);
    }

    @Patch(':projectId')
    @HttpCode(200)
    @RequireAction(ProjectAction.UPDATE)
    @Sanitize(updateProjectSchema)
    async updateProject(@Req() request: RequestX<UpdateProjectPayload>) {
        return this.projectService.updateProject(request.payload, request.user);
    }

    @Delete(':projectId')
    @HttpCode(200)
    @RequireAction(ProjectAction.DELETE)
    @Sanitize(projectPathSchema)
    async deleteProject(@Req() request: RequestX<ProjectPathPayload>) {
        return this.projectService.deleteProject(request.payload, request.user);
    }

    @Post(':projectId/favorite')
    @HttpCode(200)
    @RequireAction(ProjectAction.FAVORITE)
    @Sanitize(projectPathSchema)
    async favoriteProject(@Req() request: RequestX<ProjectPathPayload>) {
        return this.projectService.favoriteProject(request.payload, request.user);
    }

    @Delete(':projectId/favorite')
    @HttpCode(200)
    @RequireAction(ProjectAction.FAVORITE)
    @Sanitize(projectPathSchema)
    async unfavoriteProject(@Req() request: RequestX<ProjectPathPayload>) {
        return this.projectService.unfavoriteProject(request.payload, request.user);
    }
}
