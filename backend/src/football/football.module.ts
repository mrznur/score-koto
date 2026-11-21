import { Module } from '@nestjs/common';
import { FootballController } from './football.controller';
import { FootballService } from './football.service';
import { PrismaService } from '../common/prisma.service';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  controllers: [FootballController],
  providers: [FootballService, PrismaService],
  exports: [FootballService],
})
export class FootballModule {}
