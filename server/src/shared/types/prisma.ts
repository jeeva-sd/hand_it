import { Prisma } from '@prisma/client';
import { PrismaService } from '~/integrations';

export type PrismaTransaction = Prisma.TransactionClient;
export type PrismaClientLike = PrismaService | PrismaTransaction;
