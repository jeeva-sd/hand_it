import { ClsStore } from 'nestjs-cls';
import { TokenData } from '~/shared/types/request.type';

export interface Store extends ClsStore {
    workspaceId?: string;
    userId?: string;
    tokenData: TokenData;
}
