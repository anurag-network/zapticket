import { Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditController } from './audit.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
