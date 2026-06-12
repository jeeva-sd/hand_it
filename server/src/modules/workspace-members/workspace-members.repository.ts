import { Injectable } from '@nestjs/common';
import { AuthTokenType, Prisma, WorkspaceMemberStatus, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '~/integrations';
import { PrismaClientLike, PrismaTransaction } from '~/shared/types/prisma';

export const MEMBER_SELECT = {
    id: true,
    workspaceId: true,
    userId: true,
    role: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    user: { select: { id: true, fname: true, lname: true, email: true, status: true } }
} satisfies Prisma.WorkspaceMemberSelect;

@Injectable()
export class WorkspaceMembersRepository {
    constructor(private readonly prisma: PrismaService) {}

    private txHandler(transaction?: PrismaTransaction): PrismaClientLike {
        return transaction ?? this.prisma;
    }

    findWorkspaceById(workspaceId: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspace.findUnique({
            where: { id: workspaceId },
            select: { id: true, name: true, plan: true }
        });
    }

    findUserById(userId: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.findUnique({
            where: { id: userId },
            select: { id: true, fname: true }
        });
    }

    findUserByEmail(email: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.findUnique({
            where: { email },
            select: { id: true, fname: true, lname: true, email: true, status: true }
        });
    }

    createUser(fname: string, lname: string, email: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.create({
            data: { fname, lname, email, status: 'PENDING' },
            select: { id: true, fname: true, lname: true, email: true, status: true }
        });
    }

    createAuthToken(
        userId: string,
        tokenHash: string,
        type: AuthTokenType,
        expiresAt: Date,
        transaction?: PrismaTransaction
    ) {
        return this.txHandler(transaction).authToken.create({ data: { userId, tokenHash, type, expiresAt } });
    }

    findMemberByWorkspaceAndUser(workspaceId: string, userId: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            select: MEMBER_SELECT
        });
    }

    findMemberById(workspaceId: string, memberId: string, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.findFirst({
            where: { id: memberId, workspaceId },
            select: MEMBER_SELECT
        });
    }

    createMember(workspaceId: string, userId: string, role: WorkspaceRole, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.create({
            data: { workspaceId, userId, role, status: WorkspaceMemberStatus.INVITED },
            select: MEMBER_SELECT
        });
    }

    updateRole(memberId: string, role: WorkspaceRole, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.update({
            where: { id: memberId },
            data: { role },
            select: { id: true, role: true }
        });
    }

    updateStatus(memberId: string, status: WorkspaceMemberStatus, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).workspaceMember.update({
            where: { id: memberId },
            data: { status },
            select: { id: true, status: true }
        });
    }

    countActiveOwners(workspaceId: string, transaction?: PrismaTransaction): Promise<number> {
        return this.txHandler(transaction).workspaceMember.count({
            where: { workspaceId, role: WorkspaceRole.OWNER, status: WorkspaceMemberStatus.ACTIVE }
        });
    }

    private buildMembersWhere(workspaceId: string, searchTerm?: string): Prisma.WorkspaceMemberWhereInput {
        return {
            workspaceId,
            status: { not: WorkspaceMemberStatus.DELETED },
            ...(searchTerm
                ? {
                      user: {
                          OR: [
                              { fname: { contains: searchTerm } },
                              { lname: { contains: searchTerm } },
                              { email: { contains: searchTerm } }
                          ]
                      }
                  }
                : {})
        };
    }

    findMembers(
        workspaceId: string,
        searchTerm?: string,
        sortBy: string = 'createdAt',
        sortOrder: 'asc' | 'desc' = 'desc',
        skip: number = 0,
        take: number = 10,
        transaction?: PrismaTransaction
    ) {
        const where = this.buildMembersWhere(workspaceId, searchTerm);

        return this.txHandler(transaction).workspaceMember.findMany({
            where,
            orderBy: { [sortBy]: sortOrder },
            skip,
            take,
            select: MEMBER_SELECT
        });
    }

    countMembers(workspaceId: string, searchTerm?: string, transaction?: PrismaTransaction) {
        const where = this.buildMembersWhere(workspaceId, searchTerm);

        return this.txHandler(transaction).workspaceMember.count({ where });
    }
}
