import { SetMetadata } from '@nestjs/common';
import { appConfig } from '~/system/config';

export const Public = () => SetMetadata(appConfig.auth.publicAuthKey, true);
