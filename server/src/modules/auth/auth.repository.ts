import { Injectable } from '@nestjs/common';
import { init } from '@paralleldrive/cuid2';
import { AuthTokenType, UserStatus, WorkspaceMemberStatus, WorkspacePlan, WorkspaceRole } from '@prisma/client';
import { PrismaService } from '~/integrations';
import { PrismaClientLike, PrismaTransaction } from '~/shared/types/prisma';

const generateWorkspaceId = init({ length: 10 });

type CreateUserData = { fname: string; lname: string; email: string; status: UserStatus };

type UpdateUserProfileData = { id: string; fname: string; lname: string };

type MarkAuthTokensUsedByTypeData = { userId: string; type: AuthTokenType; usedAt: Date };

type CreateAuthTokenData = { userId: string; type: AuthTokenType; tokenHash: string; expiresAt: Date };

type FindAuthTokenByHashData = { tokenHash: string };

type ConsumeAuthTokenData = { id: string; usedAt: Date };

type UpdateUserPasswordData = { id: string; passwordHash: string; status: UserStatus };

type UpdateUserStatusData = { id: string; status: UserStatus };

type UpdateUserLastUsedWorkspaceData = { id: string; lastUsedWorkspaceId: string | null };

type MarkAllUserAuthTokensUsedData = { userId: string; usedAt: Date };

type FindMostRecentWorkspaceMembershipByUserData = { userId: string };

type FindWorkspaceMembershipByUserAndWorkspaceData = { userId: string; workspaceId: string };

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) {}

    private txHandler(transaction?: PrismaTransaction): PrismaClientLike {
        return transaction ?? this.prisma;
    }

    async findUserByEmail(data: { email: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.findUnique({
            where: { email: data.email, status: { not: UserStatus.DELETED } }
        });
    }

    async findUserById(data: { id: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.findUnique({ where: { id: data.id } });
    }

    async createUser(data: CreateUserData, transaction?: PrismaTransaction) {
        const execute = async (tx: PrismaClientLike) => {
            const workspaceId = generateWorkspaceId();

            // Create user first without setting lastUsedWorkspaceId to prevent foreign key violation
            const user = await tx.user.create({
                data: {
                    fname: data.fname,
                    lname: data.lname,
                    email: data.email,
                    status: data.status
                }
            });

            // Create workspace and owner membership
            await tx.workspace.create({
                data: {
                    id: workspaceId,
                    name: 'My Workspace',
                    plan: WorkspacePlan.FREE,
                    storageLimitBytes: BigInt(2 * 1024 * 1024 * 1024),
                    members: {
                        create: { userId: user.id, role: WorkspaceRole.OWNER, status: WorkspaceMemberStatus.ACTIVE }
                    }
                }
            });

            // Update user's lastUsedWorkspaceId after workspace has been created
            const updatedUser = await tx.user.update({
                where: { id: user.id },
                data: { lastUsedWorkspaceId: workspaceId }
            });

            return updatedUser;
        };

        if (transaction) {
            return execute(transaction);
        }
        return this.prisma.$transaction(execute);
    }

    async updateUserProfileImage(data: { id: string; profileMime: string | null }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.update({
            where: { id: data.id },
            data: { profileMime: data.profileMime }
        });
    }

    async updateUserProfile(data: UpdateUserProfileData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.update({
            where: { id: data.id },
            data: { fname: data.fname, lname: data.lname }
        });
    }

    async markAuthTokensUsedByType(data: MarkAuthTokensUsedByTypeData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).authToken.updateMany({
            where: { userId: data.userId, type: data.type, usedAt: null },
            data: { usedAt: data.usedAt }
        });
    }

    async createAuthToken(data: CreateAuthTokenData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).authToken.create({
            data: { userId: data.userId, type: data.type, tokenHash: data.tokenHash, expiresAt: data.expiresAt }
        });
    }

    async findAuthTokenByHash(data: FindAuthTokenByHashData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).authToken.findUnique({
            where: { tokenHash: data.tokenHash },
            select: { id: true, userId: true, type: true, expiresAt: true, usedAt: true }
        });
    }

    async consumeAuthToken(data: ConsumeAuthTokenData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).authToken.updateMany({
            where: { id: data.id, usedAt: null, expiresAt: { gt: data.usedAt } },
            data: { usedAt: data.usedAt }
        });
    }

    async updateUserPassword(data: UpdateUserPasswordData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.update({
            where: { id: data.id },
            data: { passwordHash: data.passwordHash, status: data.status }
        });
    }

    async updateUserStatus(data: UpdateUserStatusData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.update({ where: { id: data.id }, data: { status: data.status } });
    }

    async updateUserLastUsedWorkspace(data: UpdateUserLastUsedWorkspaceData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.update({
            where: { id: data.id },
            data: { lastUsedWorkspaceId: data.lastUsedWorkspaceId }
        });
    }

    async markAllUserAuthTokensUsed(data: MarkAllUserAuthTokensUsedData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).authToken.updateMany({
            where: { userId: data.userId, usedAt: null },
            data: { usedAt: data.usedAt }
        });
    }

    async findMostRecentWorkspaceMembershipByUser(
        data: FindMostRecentWorkspaceMembershipByUserData,
        transaction?: PrismaTransaction
    ) {
        return this.txHandler(transaction).workspaceMember.findFirst({
            where: { userId: data.userId },
            orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
            select: { workspaceId: true, role: true, workspace: { select: { id: true, name: true, plan: true } } }
        });
    }

    async findWorkspaceMembershipByUserAndWorkspace(
        data: FindWorkspaceMembershipByUserAndWorkspaceData,
        transaction?: PrismaTransaction
    ) {
        return this.txHandler(transaction).workspaceMember.findFirst({
            where: { userId: data.userId, workspaceId: data.workspaceId },
            select: { workspaceId: true, role: true, workspace: { select: { id: true, name: true, plan: true } } }
        });
    }
}
