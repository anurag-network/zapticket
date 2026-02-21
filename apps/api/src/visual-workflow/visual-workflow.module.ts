import { Module } from '@nestjs/common';
import { VisualWorkflowService } from './visual-workflow.service';
import { VisualWorkflowController } from './visual-workflow.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VisualWorkflowController],
  providers: [VisualWorkflowService],
  exports: [VisualWorkflowService],
})
export class VisualWorkflowModule {}
