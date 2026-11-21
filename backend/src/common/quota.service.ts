import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Tracks provider API usage per UTC day in the ApiUsage table,
 * so counts survive restarts and reset automatically at midnight UTC.
 */
@Injectable()
export class QuotaService {
  constructor(private prisma: PrismaService) {}

  private today(): string {
    return new Date().toISOString().split('T')[0];
  }

  async getUsed(provider: string): Promise<number> {
    const row = await this.prisma.apiUsage.findUnique({
      where: { provider_date: { provider, date: this.today() } },
    });
    return row?.requests ?? 0;
  }

  /** Records one request and returns today's new total for the provider. */
  async record(provider: string, limit: number): Promise<number> {
    const date = this.today();
    const row = await this.prisma.apiUsage.upsert({
      where: { provider_date: { provider, date } },
      create: { provider, date, requests: 1, limit },
      update: { requests: { increment: 1 }, limit },
    });
    return row.requests;
  }
}
