import { Module } from '@nestjs/common';
import { TicketViewsService } from './ticket-views.service';
import { TicketViewsController } from './ticket-views.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TicketViewsController],
  providers: [TicketViewsService],
  exports: [TicketViewsService],
})
export class TicketViewsModule {}
