import { Injectable } from '@nestjs/common';
import { Prisma, WorkspacePlan, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '~/integrations';
import { PrismaClientLike, PrismaTransaction } from '~/shared/types/prisma';

type CreateWorkspaceData = { name: string; createdByUserId: string; plan: WorkspacePlan; storageLimitBytes: bigint };

type CreateWorkspaceMemberData = { workspaceId: string; userId: string; role: WorkspaceRole };

type FindWorkspaceMembershipData = { workspaceId: string; userId: string };

type FindWorkspaceByUserData = { workspaceId: string; userId: string };

type UpdateWorkspaceData = { workspaceId: string; name: string };

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

export type WorkspaceWithMemberCount = Prisma.WorkspaceGetPayload<{ select: typeof workspaceSelect }>;

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

    async findWorkspaceMemberUserIds(data: { workspaceId: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.findMany({
            where: { workspaceId: data.workspaceId },
            select: { userId: true }
        });
    }
}
