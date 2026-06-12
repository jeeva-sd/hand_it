import { Injectable } from '@nestjs/common';
import { Prisma, WorkspaceMemberStatus, WorkspacePlan, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '~/integrations';
import { PrismaClientLike, PrismaTransaction } from '~/shared/types/prisma';

export const WORKSPACE_SELECT = {
    id: true,
    name: true,
    plan: true,
    storageLimitBytes: true,
    storageUsedBytes: true,
    createdAt: true,
    updatedAt: true,
    _count: { select: { members: true } }
} satisfies Prisma.WorkspaceSelect;

export const WORKSPACE_LIST_SELECT = { id: true, name: true, createdAt: true } satisfies Prisma.WorkspaceSelect;

@Injectable()
export class WorkspaceRepository {
    constructor(private readonly prisma: PrismaService) {}

    private txHandler(transaction?: PrismaTransaction): PrismaClientLike {
        return transaction ?? this.prisma;
    }

    createWorkspace(
        workspaceId: string,
        name: string,
        userId: string,
        storageLimitBytes: bigint,
        transaction?: PrismaTransaction
    ) {
        return this.txHandler(transaction).workspace.create({
            data: {
                id: workspaceId,
                name,
                plan: WorkspacePlan.FREE,
                storageLimitBytes,
                members: { create: { userId, role: WorkspaceRole.OWNER, status: WorkspaceMemberStatus.ACTIVE } }
            },
            select: { id: true }
        });
    }

    async findActiveMemberUserIds(workspaceId: string, transaction?: PrismaTransaction): Promise<string[]> {
        const members = await this.txHandler(transaction).workspaceMember.findMany({
            where: { workspaceId, status: WorkspaceMemberStatus.ACTIVE },
            select: { userId: true }
        });
        return members.map(m => m.userId);
    }

    findWorkspaceById(workspaceId: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspace.findUnique({
            where: { id: workspaceId },
            select: WORKSPACE_SELECT
        });
    }

    async findMemberRole(
        workspaceId: string,
        userId: string,
        transaction?: PrismaTransaction
    ): Promise<WorkspaceRole | null> {
        const member = await this.txHandler(transaction).workspaceMember.findFirst({
            where: { workspaceId, userId, status: WorkspaceMemberStatus.ACTIVE },
            select: { role: true }
        });
        return member?.role ?? null;
    }

    findMemberWorkspace(workspaceId: string, userId: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.findFirst({
            where: { workspaceId, userId, status: WorkspaceMemberStatus.ACTIVE },
            select: { role: true, workspace: { select: WORKSPACE_SELECT } }
        });
    }

    findWorkspaces(
        userId: string,
        searchTerm?: string,
        sortBy: string = 'createdAt',
        sortOrder: 'asc' | 'desc' = 'desc',
        skip: number = 0,
        take: number = 10,
        transaction?: PrismaTransaction
    ) {
        return this.txHandler(transaction).workspace.findMany({
            where: {
                members: { some: { userId, status: WorkspaceMemberStatus.ACTIVE } },
                name: searchTerm ? { contains: searchTerm } : undefined
            },
            orderBy: { [sortBy]: sortOrder },
            skip,
            take,
            select: WORKSPACE_LIST_SELECT
        });
    }

    countWorkspaces(userId: string, searchTerm?: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspace.count({
            where: {
                members: { some: { userId, status: WorkspaceMemberStatus.ACTIVE } },
                name: searchTerm ? { contains: searchTerm } : undefined
            }
        });
    }

    updateWorkspace(workspaceId: string, name?: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspace.update({
            where: { id: workspaceId },
            data: { name },
            select: WORKSPACE_SELECT
        });
    }

    deleteWorkspace(workspaceId: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspace.delete({ where: { id: workspaceId } });
    }

    updateUserLastWorkspace(userId: string, workspaceId: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.update({
            where: { id: userId },
            data: { lastUsedWorkspaceId: workspaceId }
        });
    }
}
