import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { EnhancedWorkflowsController } from './enhanced-workflows.controller';
import { EnhancedWorkflowsService } from './enhanced-workflows.service';

@Module({
  controllers: [WorkflowsController, EnhancedWorkflowsController],
  providers: [WorkflowsService, EnhancedWorkflowsService],
  exports: [WorkflowsService, EnhancedWorkflowsService],
})
export class WorkflowsModule {}
