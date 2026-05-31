import { Injectable } from '@nestjs/common';
import { AuthTokenType } from '@prisma/client';
import { PrismaService } from '~/integrations';
import { PrismaClientLike, PrismaTransaction } from '~/shared/types/prisma';

type CreateUserData = { fname: string; lname: string; email: string; status: number };

type UpdateUserProfileData = { id: string; fname: string; lname: string };

type MarkAuthTokensUsedByTypeData = { userId: string; type: AuthTokenType; usedAt: Date };

type CreateAuthTokenData = { userId: string; type: AuthTokenType; tokenHash: string; expiresAt: Date };

type FindAuthTokenByHashData = { tokenHash: string };

type ConsumeAuthTokenData = { id: string; usedAt: Date };

type UpdateUserPasswordData = { id: string; passwordHash: string; status: number };

type UpdateUserStatusData = { id: string; status: number };

type MarkAllUserAuthTokensUsedData = { userId: string; usedAt: Date };

@Injectable()
export class AuthRepository {
    constructor(private readonly prisma: PrismaService) {}

    private txHandler(transaction?: PrismaTransaction): PrismaClientLike {
        return transaction ?? this.prisma;
    }

    async findUserByEmail(data: { email: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.findUnique({ where: { email: data.email } });
    }

    async findUserById(data: { id: string }, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.findUnique({ where: { id: data.id } });
    }

    async createUser(data: CreateUserData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).user.create({
            data: { fname: data.fname, lname: data.lname, email: data.email, status: data.status }
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
        return this.txHandler(transaction).user.update({
            where: { id: data.id },
            data: { status: data.status }
        });
    }

    async markAllUserAuthTokensUsed(data: MarkAllUserAuthTokensUsedData, transaction?: PrismaTransaction) {
        return this.txHandler(transaction).authToken.updateMany({
            where: { userId: data.userId, usedAt: null },
            data: { usedAt: data.usedAt }
        });
    }
}
