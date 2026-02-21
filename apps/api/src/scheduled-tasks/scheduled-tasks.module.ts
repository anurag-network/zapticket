import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { EscalationModule } from '../escalation/escalation.module';

@Module({
  imports: [ScheduleModule.forRoot(), EscalationModule],
  providers: [ScheduledTasksService],
})
export class ScheduledTasksModule {}
