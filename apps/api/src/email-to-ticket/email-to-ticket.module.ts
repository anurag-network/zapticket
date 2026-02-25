import { Module } from '@nestjs/common';
import { EmailToTicketController } from './email-to-ticket.controller';
import { EmailToTicketService } from './email-to-ticket.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TicketsModule } from '../tickets/tickets.module';

@Module({
  imports: [PrismaModule, TicketsModule],
  controllers: [EmailToTicketController],
  providers: [EmailToTicketService],
  exports: [EmailToTicketService],
})
export class EmailToTicketModule {}
