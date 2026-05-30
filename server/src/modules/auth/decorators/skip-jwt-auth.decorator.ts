import { SetMetadata } from '@nestjs/common';
import { appConfig } from '~/system/config';

export const SkipJwtAuth = () => SetMetadata(appConfig.auth.skipJwtAuthKey, true);
