import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { MessagesService } from './messages.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, MessagesService],
  exports: [TicketsService],
})
export class TicketsModule {}
