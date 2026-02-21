import { Module } from '@nestjs/common';
import { SentimentService } from './sentiment.service';
import { SentimentController } from './sentiment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { EscalationModule } from '../escalation/escalation.module';

@Module({
  imports: [PrismaModule, ChatbotModule, EscalationModule],
  controllers: [SentimentController],
  providers: [SentimentService],
  exports: [SentimentService],
})
export class SentimentModule {}
