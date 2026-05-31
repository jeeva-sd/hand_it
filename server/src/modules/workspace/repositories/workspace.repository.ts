import { Injectable } from '@nestjs/common';
import { Prisma, ProjectStatus, WorkspacePlan, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '~/integrations';
import { PrismaClientLike, PrismaTransaction } from '~/shared/types/prisma';

type CreateWorkspaceData = { name: string; createdByUserId: string; plan: WorkspacePlan; storageLimitBytes: bigint };

type CreateWorkspaceMemberData = { workspaceId: string; userId: string; role: WorkspaceRole };

type FindWorkspaceMembershipData = { workspaceId: string; userId: string };

type FindWorkspaceByUserData = { workspaceId: string; userId: string };

type UpdateWorkspaceData = { workspaceId: string; name: string };

type DeleteWorkspaceData = { workspaceId: string };

type CreateProjectData = { workspaceId: string; name: string; description?: string | null; status?: ProjectStatus };

const workspaceSelect = {
    id: true,
    name: true,
    plan: true,
    storageLimitBytes: true,
    storageUsedBytes: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { members: true } }
} satisfies Prisma.WorkspaceSelect;

const workspaceMemberWithWorkspaceSelect = {
    role: true,
    workspace: { select: workspaceSelect }
} satisfies Prisma.WorkspaceMemberSelect;

const workspaceMemberListSelect = {
    id: true,
    userId: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    user: { select: { id: true, fname: true, lname: true, email: true } }
} satisfies Prisma.WorkspaceMemberSelect;

const projectSelect = {
    id: true,
    workspaceId: true,
    name: true,
    description: true,
    status: true,
    createdAt: true,
    updatedAt: true
} satisfies Prisma.ProjectSelect;

export type WorkspaceWithMemberCount = Prisma.WorkspaceGetPayload<{ select: typeof workspaceSelect }>;
export type ProjectRecord = Prisma.ProjectGetPayload<{ select: typeof projectSelect }>;
export type WorkspaceMemberRecord = Prisma.WorkspaceMemberGetPayload<{ select: typeof workspaceMemberListSelect }>;

export type WorkspaceMembershipWithWorkspace = Prisma.WorkspaceMemberGetPayload<{
    select: typeof workspaceMemberWithWorkspaceSelect;
}>;

@Injectable()
export class WorkspaceRepository {
    constructor(private readonly prisma: PrismaService) {}

    private txHandler(transaction?: PrismaTransaction): PrismaClientLike {
        return transaction ?? this.prisma;
    }

    async createWorkspace(data: CreateWorkspaceData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspace.create({
            data: {
                name: data.name,
                createdByUserId: data.createdByUserId,
                plan: data.plan,
                storageLimitBytes: data.storageLimitBytes
            },
            select: workspaceSelect
        });
    }

    async createWorkspaceMember(data: CreateWorkspaceMemberData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.create({
            data: { workspaceId: data.workspaceId, userId: data.userId, role: data.role },
            select: { id: true }
        });
    }

    async listWorkspacesByUser(data: { userId: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.findMany({
            where: { userId: data.userId },
            orderBy: { createdAt: 'desc' },
            select: workspaceMemberWithWorkspaceSelect
        });
    }

    async findWorkspaceByIdForUser(data: FindWorkspaceByUserData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.findFirst({
            where: { workspaceId: data.workspaceId, userId: data.userId },
            select: workspaceMemberWithWorkspaceSelect
        });
    }

    async findWorkspaceMembership(data: FindWorkspaceMembershipData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.findFirst({
            where: { workspaceId: data.workspaceId, userId: data.userId },
            select: { role: true }
        });
    }

    async updateWorkspace(data: UpdateWorkspaceData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspace.update({
            where: { id: data.workspaceId },
            data: { name: data.name },
            select: workspaceSelect
        });
    }

    async deleteWorkspace(data: DeleteWorkspaceData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspace.delete({ where: { id: data.workspaceId }, select: { id: true } });
    }

    async findWorkspaceMemberUserIds(data: { workspaceId: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.findMany({
            where: { workspaceId: data.workspaceId },
            select: { userId: true }
        });
    }

    async listWorkspaceMembers(data: { workspaceId: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.findMany({
            where: { workspaceId: data.workspaceId },
            orderBy: [{ createdAt: 'asc' }],
            select: workspaceMemberListSelect
        });
    }

    async createProject(data: CreateProjectData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).project.create({
            data: {
                workspaceId: data.workspaceId,
                name: data.name,
                description: data.description ?? null,
                status: data.status ?? ProjectStatus.ACTIVE
            },
            select: projectSelect
        });
    }

    async listProjectsByWorkspace(data: { workspaceId: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).project.findMany({
            where: { workspaceId: data.workspaceId },
            orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
            select: projectSelect
        });
    }
}
