import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatus } from '@prisma/client';
import { PrismaService } from '~/integrations';
import { PrismaClientLike, PrismaTransaction } from '~/shared/types/prisma';

type CreateProjectData = { workspaceId: string; name: string; description?: string | null; status: ProjectStatus };

type UpdateProjectData = { projectId: string; name?: string; description?: string | null; status?: ProjectStatus };

type ListProjectsPaginatedData = {
    workspaceId: string;
    page: number;
    size: number;
    searchTerm?: string;
    sortOrder: 'asc' | 'desc';
    status?: ProjectStatus;
};

const projectSelect = {
    id: true,
    workspaceId: true,
    name: true,
    description: true,
    status: true,
    createdAt: true,
    updatedAt: true
} satisfies Prisma.ProjectSelect;

export type ProjectRecord = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;

@Injectable()
export class ProjectRepository {
    constructor(private readonly prisma: PrismaService) {}

    private txHandler(transaction?: PrismaTransaction): PrismaClientLike {
        return transaction ?? this.prisma;
    }

    async findWorkspaceMembership(data: { workspaceId: string; userId: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.findFirst({
            where: { workspaceId: data.workspaceId, userId: data.userId },
            select: { role: true }
        });
    }

    async countProjects(
        data: Omit<ListProjectsPaginatedData, 'page' | 'size' | 'sortOrder'>,
        transaction?: PrismaTransaction
    ) {
        const where: Prisma.ProjectWhereInput = {
            workspaceId: data.workspaceId,
            ...(data.status ? { status: data.status } : {}),
            ...(data.searchTerm
                ? { OR: [{ name: { contains: data.searchTerm } }, { description: { contains: data.searchTerm } }] }
                : {})
        };

        return this.txHandler(transaction).project.count({ where });
    }

    async listProjectsPaginated(data: ListProjectsPaginatedData, transaction?: PrismaTransaction) {
        const where: Prisma.ProjectWhereInput = {
            workspaceId: data.workspaceId,
            ...(data.status ? { status: data.status } : {}),
            ...(data.searchTerm
                ? { OR: [{ name: { contains: data.searchTerm } }, { description: { contains: data.searchTerm } }] }
                : {})
        };

        const skip = (data.page - 1) * data.size;

        return this.txHandler(transaction).project.findMany({
            where,
            orderBy: [{ updatedAt: data.sortOrder }, { id: 'desc' }],
            skip,
            take: data.size,
            select: projectSelect
        });
    }

    async findProjectById(data: { workspaceId: string; projectId: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).project.findFirst({
            where: { workspaceId: data.workspaceId, id: data.projectId },
            select: projectSelect
        });
    }

    async createProject(data: CreateProjectData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).project.create({
            data: {
                workspaceId: data.workspaceId,
                name: data.name,
                description: data.description ?? null,
                status: data.status
            },
            select: projectSelect
        });
    }

    async updateProject(data: UpdateProjectData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).project.update({
            where: { id: data.projectId },
            data: {
                ...(data.name !== undefined ? { name: data.name } : {}),
                ...(data.description !== undefined ? { description: data.description } : {}),
                ...(data.status !== undefined ? { status: data.status } : {})
            },
            select: projectSelect
        });
    }

    async deleteProject(data: { projectId: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).project.delete({ where: { id: data.projectId }, select: { id: true } });
    }

    async favoriteProject(data: { projectId: string; userId: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).projectFavorite.upsert({
            where: { projectId_userId: { projectId: data.projectId, userId: data.userId } },
            update: {},
            create: { projectId: data.projectId, userId: data.userId }
        });
    }

    async unfavoriteProject(data: { projectId: string; userId: string }, transaction?: PrismaTransaction) {
        try {
            await this.txHandler(transaction).projectFavorite.delete({
                where: { projectId_userId: { projectId: data.projectId, userId: data.userId } }
            });
        } catch (_error) {
            // Ignore if does not exist
        }
    }

    async findFavoriteProjectIds(data: { userId: string; projectIds: string[] }, transaction?: PrismaTransaction) {
        const favors = await this.txHandler(transaction).projectFavorite.findMany({
            where: { userId: data.userId, projectId: { in: data.projectIds } },
            select: { projectId: true }
        });
        return new Set(favors.map(f => f.projectId));
    }
}
