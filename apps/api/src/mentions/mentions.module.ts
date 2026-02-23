import { Module } from '@nestjs/common';
import { MentionsService } from './mentions.service';
import { MentionsController } from './mentions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [MentionsController],
  providers: [MentionsService],
  exports: [MentionsService],
})
export class MentionsModule {}
