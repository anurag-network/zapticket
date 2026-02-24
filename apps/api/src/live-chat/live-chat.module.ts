import { Module } from '@nestjs/common';
import { LiveChatService } from './live-chat.service';
import { LiveChatController, PublicLiveChatController } from './live-chat.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LiveChatController, PublicLiveChatController],
  providers: [LiveChatService],
  exports: [LiveChatService],
})
export class LiveChatModule {}
