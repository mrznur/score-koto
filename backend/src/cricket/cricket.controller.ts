import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CricketService } from './cricket.service';

@ApiTags('cricket')
@Controller('cricket')
export class CricketController {
  constructor(private readonly cricketService: CricketService) {}

  @Get('live')
  @ApiOperation({ summary: 'Get live cricket matches' })
  getLive() {
    return this.cricketService.getLive();
  }

  @Get('fixtures')
  @ApiOperation({ summary: 'Get upcoming cricket matches' })
  getFixtures() {
    return this.cricketService.getFixtures();
  }

  @Get('results')
  @ApiOperation({ summary: 'Get recent cricket results' })
  getResults() {
    return this.cricketService.getResults();
  }

  @Get('matches/:id')
  @ApiOperation({ summary: 'Get cricket match with scorecard' })
  getMatch(@Param('id') id: string) {
    return this.cricketService.getMatch(id);
  }

  @Get('by-date/:date')
  @ApiOperation({ summary: 'Get all cricket matches for a date (YYYY-MM-DD)' })
  getByDate(@Param('date') date: string) {
    return this.cricketService.getByDate(date);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Manually trigger cricket sync' })
  sync() {
    return this.cricketService.syncCurrent();
  }

  @Post('matches/:id/sync-scorecard')
  @ApiOperation({ summary: 'Sync scorecard for a specific match' })
  syncScorecard(@Param('id') id: string) {
    return this.cricketService.syncScorecard(id);
  }
}
