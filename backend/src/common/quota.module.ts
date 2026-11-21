import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { QuotaService } from './quota.service';

/**
 * Global module: any module can inject QuotaService without importing this module again.
 */
@Global()
@Module({
  providers: [PrismaService, QuotaService],
  exports: [QuotaService],
})
export class QuotaModule {}