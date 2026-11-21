import { Module } from '@nestjs/common';
import { CricketController } from './cricket.controller';
import { CricketService } from './cricket.service';
import { PrismaService } from '../common/prisma.service';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  controllers: [CricketController],
  providers: [CricketService, PrismaService],
  exports: [CricketService],
})
export class CricketModule {}
