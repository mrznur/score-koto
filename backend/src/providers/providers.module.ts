import { Module } from '@nestjs/common';
import { ApiFootballProvider } from './api-football.provider';
import { FootballDataProvider } from './football-data.provider';
import { TheSportsDbProvider } from './thesportsdb.provider';
import { GoalApiProvider } from './goal-api.provider';
import { FootballProviderManager } from './football-provider.manager';
import { CricketProviderManager } from './cricket-provider.manager';

@Module({
  providers: [
    ApiFootballProvider,
    FootballDataProvider,
    TheSportsDbProvider,
    GoalApiProvider,
    FootballProviderManager,
    CricketProviderManager,
  ],
  exports: [
    FootballProviderManager,
    CricketProviderManager,
    GoalApiProvider,
  ],
})
export class ProvidersModule {}
