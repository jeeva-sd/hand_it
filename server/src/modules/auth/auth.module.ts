import { Module } from '@nestjs/common';
import { DatabaseModule, EmailsModule, R2Module } from '~/integrations';
import { EventModule } from '../events/events.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { GoogleAuthController } from './google-auth.controller';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { StrategyModule } from './strategies/strategy.module';

@Module({
    imports: [StrategyModule, EventModule, DatabaseModule, EmailsModule, R2Module],
    controllers: [AuthController, GoogleAuthController],
    providers: [AuthService, AuthRepository, JwtAuthGuard]
})
export class AuthModule {}
