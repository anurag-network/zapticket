import { Module } from '@nestjs/common';
import { BulkOperationsService } from './bulk-operations.service';
import { BulkOperationsController } from './bulk-operations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [PrismaModule, ActivityLogModule],
  controllers: [BulkOperationsController],
  providers: [BulkOperationsService],
  exports: [BulkOperationsService],
})
export class BulkOperationsModule {}
