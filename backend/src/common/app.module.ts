import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { QuotaModule } from './common/quota.module';
import { FootballModule } from './football/football.module';
import { CricketModule } from './cricket/cricket.module';
import { HealthModule } from './health/health.module';
import { SyncModule } from './sync/sync.module';
import { LiveModule } from './live/live.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    QuotaModule,
    FootballModule,
    CricketModule,
    HealthModule,
    LiveModule,
    SyncModule,
  ],
})
export class AppModule {}
