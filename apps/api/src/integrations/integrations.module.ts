import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { WebhooksService } from './webhooks.service';
import { SlackService } from './slack.service';
import { DiscordService } from './discord.service';
import { ApiKeysService } from './api-keys.service';

@Module({
  controllers: [IntegrationsController],
  providers: [WebhooksService, SlackService, DiscordService, ApiKeysService],
  exports: [WebhooksService, SlackService, DiscordService, ApiKeysService],
})
export class IntegrationsModule {}
