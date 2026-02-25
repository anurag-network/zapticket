import { Module } from '@nestjs/common';
import { WebhookSubscriptionsController } from './webhook-subscriptions.controller';
import { WebhookSubscriptionsService } from './webhook-subscriptions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [WebhookSubscriptionsController],
  providers: [WebhookSubscriptionsService],
  exports: [WebhookSubscriptionsService],
})
export class WebhookSubscriptionsModule {}
