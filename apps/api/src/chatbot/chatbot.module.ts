import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { AIProviderService } from './ai-provider.service';
import { PublicChatbotController, ChatbotController } from './chatbot.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { AssignmentModule } from '../assignment/assignment.module';

@Module({
  imports: [PrismaModule, EmailModule, AssignmentModule],
  controllers: [PublicChatbotController, ChatbotController],
  providers: [ChatbotService, AIProviderService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
