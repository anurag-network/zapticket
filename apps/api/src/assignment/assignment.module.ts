import { Module } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { AssignmentRuleController, TicketAssignmentController } from './assignment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TicketLockModule } from '../ticket-lock/ticket-lock.module';

@Module({
  imports: [PrismaModule, TicketLockModule],
  controllers: [AssignmentRuleController, TicketAssignmentController],
  providers: [AssignmentService],
  exports: [AssignmentService],
})
export class AssignmentModule {}
