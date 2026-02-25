import { Module } from '@nestjs/common';
import { ScheduledReportsController } from './scheduled-reports.controller';
import { ScheduledReportsService } from './scheduled-reports.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScheduledReportsController],
  providers: [ScheduledReportsService],
  exports: [ScheduledReportsService],
})
export class ScheduledReportsModule {}
