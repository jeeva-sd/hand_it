import { Module } from '@nestjs/common';
import { DatabaseModule, EmailsModule } from '~/integrations';
import { EventModule } from '../events/events.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategies/jwt-auth.guard';
import { StrategyModule } from './strategies/strategy.module';

@Module({
    imports: [StrategyModule, EventModule, DatabaseModule, EmailsModule],
    controllers: [AuthController],
    providers: [AuthService, AuthRepository, JwtAuthGuard]
})
export class AuthModule {}
