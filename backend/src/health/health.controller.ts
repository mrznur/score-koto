import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';
import { FootballService } from '../football/football.service';
import { CricketService } from '../cricket/cricket.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private football: FootballService,
    private cricket: CricketService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'API health check' })
  async check() {
    let dbOk = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbOk = true;
    } catch {}

    return {
      status: dbOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: { database: dbOk ? 'ok' : 'down' },
    };
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get status of all data providers' })
  providers() {
    return {
      football: this.football.getProviderStatuses(),
      cricket: this.cricket.getProviderStatuses(),
    };
  }

  @Get('sync')
  @ApiOperation({ summary: 'Get recent sync logs' })
  async syncStatus() {
    return this.prisma.syncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
