import { Module } from '@nestjs/common';
import { GoalApiProvider } from './goal-api.provider';
import { CricketProviderManager } from './cricket-provider.manager';

@Module({
  providers: [GoalApiProvider, CricketProviderManager],
  exports: [GoalApiProvider, CricketProviderManager],
})
export class ProvidersModule {}
