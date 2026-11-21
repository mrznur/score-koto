import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FootballService } from './football.service';

@ApiTags('football')
@Controller('football')
export class FootballController {
  constructor(private readonly footballService: FootballService) {}

  @Get('live')
  @ApiOperation({ summary: 'Get all live football matches' })
  getLive() { return this.footballService.getLive(); }

  @Get('fixtures')
  @ApiOperation({ summary: 'Get upcoming fixtures' })
  getFixtures() { return this.footballService.getFixtures(); }

  @Get('results')
  @ApiOperation({ summary: 'Get recent results' })
  getResults() { return this.footballService.getResults(); }

  @Get('matches/:id')
  @ApiOperation({ summary: 'Get match with full Goal API detail' })
  getMatch(@Param('id') id: string) { return this.footballService.getMatchDetail(id); }

  @Get('by-date/:date')
  @ApiOperation({ summary: 'Get all football matches for a date (YYYY-MM-DD)' })
  getByDate(@Param('date') date: string) { return this.footballService.getByDate(date); }

  @Get('standings/:leagueId')
  @ApiOperation({ summary: 'Get standings for a league' })
  getStandings(@Param('leagueId') leagueId: string) { return this.footballService.getStandings(leagueId); }

  @Get('teams/:teamId')
  @ApiOperation({ summary: 'Get team profile' })
  getTeam(@Param('teamId') teamId: string) { return this.footballService.getTeam(teamId); }

  @Get('teams/:teamId/squad')
  @ApiOperation({ summary: 'Get team squad' })
  getTeamSquad(@Param('teamId') teamId: string) { return this.footballService.getTeamSquad(teamId); }

  @Get('teams/:teamId/results')
  @ApiOperation({ summary: 'Get team results' })
  getTeamResults(@Param('teamId') teamId: string) { return this.footballService.getTeamResults(teamId); }

  @Get('teams/:teamId/fixtures')
  @ApiOperation({ summary: 'Get team upcoming fixtures' })
  getTeamFixtures(@Param('teamId') teamId: string) { return this.footballService.getTeamFixtures(teamId); }

  @Get('leagues/top')
  @ApiOperation({ summary: 'Get top leagues list from Goal API' })
  getTopLeagues() { return this.footballService.getTopLeagues(); }
}
