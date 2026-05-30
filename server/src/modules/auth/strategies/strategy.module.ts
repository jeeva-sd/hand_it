import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseModule } from '~/integrations';
import { appConfig } from '~/system/config';
import { JwtStrategy } from './jwt.strategy';

@Module({
    imports: [DatabaseModule],
    providers: [
        JwtStrategy,
        {
            provide: appConfig.auth.basicJWT.name,
            useFactory: () => {
                return new JwtService({
                    secret: appConfig.auth.basicJWT.secret,
                    signOptions: { expiresIn: appConfig.auth.basicJWT.expiresIn }
                });
            }
        }
    ],
    exports: [appConfig.auth.basicJWT.name]
})
export class StrategyModule {}
