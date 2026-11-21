import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { FootballModule } from '../football/football.module';
import { CricketModule } from '../cricket/cricket.module';
import { LiveModule } from '../live/live.module';

@Module({
  imports: [FootballModule, CricketModule, LiveModule],
  providers: [SyncService],
})
export class SyncModule {}
