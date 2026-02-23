import { Module } from '@nestjs/common';
import { FollowUpsController, SnoozesController } from './follow-ups.controller';
import { FollowUpsService } from './follow-ups.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [FollowUpsController, SnoozesController],
  providers: [FollowUpsService],
  exports: [FollowUpsService],
})
export class FollowUpsModule {}
