import { Module } from '@nestjs/common';
import { TicketMergeService } from './ticket-merge.service';
import { TicketMergeController } from './ticket-merge.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityLogModule } from '../activity-log/activity-log.module';

@Module({
  imports: [PrismaModule, ActivityLogModule],
  controllers: [TicketMergeController],
  providers: [TicketMergeService],
  exports: [TicketMergeService],
})
export class TicketMergeModule {}
