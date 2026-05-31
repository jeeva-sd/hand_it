import { Module } from '@nestjs/common';
import { DatabaseModule } from '~/integrations';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { StrategyModule } from '../auth/strategies/strategy.module';
import { ProjectController } from './controllers/project.controller';
import { ProjectRepository } from './repositories/project.repository';
import { ProjectService } from './services/project.service';

@Module({
    imports: [StrategyModule, DatabaseModule],
    controllers: [ProjectController],
    providers: [ProjectService, ProjectRepository, JwtAuthGuard],
    exports: [ProjectService, ProjectRepository]
})
export class ProjectModule {}
