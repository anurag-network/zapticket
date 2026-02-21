import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { WorkflowsModule } from '../workflows/workflows.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [ScheduleModule.forRoot(), WorkflowsModule, IntegrationsModule],
  providers: [ScheduledTasksService],
})
export class ScheduledTasksModule {}
