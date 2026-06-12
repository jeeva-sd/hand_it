import { WorkspaceRole } from '@prisma/client';
import { ClsStore } from 'nestjs-cls';
import { TokenData } from '~/shared/types/request.type';

export interface Store extends ClsStore {
    workspaceId?: string;
    workspaceRole?: WorkspaceRole;
    userId?: string;
    tokenData: TokenData;
}
