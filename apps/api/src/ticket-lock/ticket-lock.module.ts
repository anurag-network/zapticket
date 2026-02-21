import { Module } from '@nestjs/common';
import { TicketLockService } from './ticket-lock.service';
import { TicketLockController, BulkTicketLockController } from './ticket-lock.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TicketLockController, BulkTicketLockController],
  providers: [TicketLockService],
  exports: [TicketLockService],
})
export class TicketLockModule {}
