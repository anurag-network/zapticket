import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { CRMController } from './crm.controller';
import { WebhooksService } from './webhooks.service';
import { SlackService } from './slack.service';
import { DiscordService } from './discord.service';
import { ApiKeysService } from './api-keys.service';
import { SalesforceService } from './salesforce/salesforce.service';
import { HubSpotService } from './hubspot/hubspot.service';

@Module({
  controllers: [IntegrationsController, CRMController],
  providers: [
    WebhooksService, 
    SlackService, 
    DiscordService, 
    ApiKeysService,
    SalesforceService,
    HubSpotService,
  ],
  exports: [
    WebhooksService, 
    SlackService, 
    DiscordService, 
    ApiKeysService,
    SalesforceService,
    HubSpotService,
  ],
})
export class IntegrationsModule {}
