import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../common/prisma.service';
import { FootballModule } from '../football/football.module';
import { CricketModule } from '../cricket/cricket.module';

@Module({
  imports: [FootballModule, CricketModule],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class HealthModule {}
