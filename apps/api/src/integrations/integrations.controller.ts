import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { SlackService } from './slack.service';
import { DiscordService } from './discord.service';
import { ApiKeysService } from './api-keys.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

// Custom guard for API key authentication
class ApiKeyGuard {
  constructor(private apiKeys: ApiKeysService) {}

  async canActivate(context: any): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const key = await this.apiKeys.validate(apiKey);
    if (!key) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.apiKey = key;
    return true;
  }
}

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(
    private webhooks: WebhooksService,
    private slack: SlackService,
    private discord: DiscordService,
    private apiKeys: ApiKeysService
  ) {}

  // Webhooks
  @Get('webhooks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List webhooks' })
  listWebhooks(@Req() req: any) {
    return this.webhooks.findAll(req.user.organizationId);
  }

  @Post('webhooks')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create webhook' })
  createWebhook(
    @Req() req: any,
    @Body() data: { url: string; events: string[]; secret?: string }
  ) {
    return this.webhooks.create(req.user.organizationId, data);
  }

  @Get('webhooks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get webhook details' })
  getWebhook(@Param('id') id: string, @Req() req: any) {
    return this.webhooks.findOne(id, req.user.organizationId);
  }

  @Delete('webhooks/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete webhook' })
  deleteWebhook(@Param('id') id: string, @Req() req: any) {
    return this.webhooks.delete(id, req.user.organizationId);
  }

  // Slack
  @Post('slack/message')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send Slack message' })
  async sendSlackMessage(
    @Req() req: any,
    @Body() data: { channelId?: string; text: string }
  ) {
    return this.slack.sendMessage(req.user.organizationId, data);
  }

  // Discord
  @Post('discord/message')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send Discord message' })
  async sendDiscordMessage(
    @Req() req: any,
    @Body() data: { channelId?: string; content?: string }
  ) {
    return this.discord.sendMessage(req.user.organizationId, data);
  }

  // API Keys
  @Get('api-keys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List API keys' })
  listApiKeys(@Req() req: any) {
    return this.apiKeys.findAll(req.user.organizationId);
  }

  @Post('api-keys')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create API key' })
  createApiKey(
    @Req() req: any,
    @Body() data: { name: string; permissions?: string[] }
  ) {
    return this.apiKeys.create(req.user.organizationId, data);
  }

  @Delete('api-keys/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete API key' })
  deleteApiKey(@Param('id') id: string, @Req() req: any) {
    return this.apiKeys.delete(id, req.user.organizationId);
  }
}
