import { Module } from '@nestjs/common';
import { SmartResponseService } from './smart-responses.service';
import { SmartResponseController } from './smart-responses.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [PrismaModule, ChatbotModule],
  controllers: [SmartResponseController],
  providers: [SmartResponseService],
  exports: [SmartResponseService],
})
export class SmartResponsesModule {}
