import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookSubscriptionsService } from './webhook-subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('Webhook Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('webhook-subscriptions')
export class WebhookSubscriptionsController {
  constructor(private webhooks: WebhookSubscriptionsService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get all webhook subscriptions' })
  findAll(@Req() req: any) {
    return this.webhooks.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get webhook subscription by ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.webhooks.findOne(id, req.user.organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create webhook subscription' })
  create(@Req() req: any, @Body() data: {
    name: string;
    url: string;
    events: string[];
    secret?: string;
  }) {
    return this.webhooks.create(req.user.organizationId, data);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update webhook subscription' })
  update(@Param('id') id: string, @Req() req: any, @Body() data: {
    name?: string;
    url?: string;
    events?: string[];
    secret?: string;
    isActive?: boolean;
  }) {
    return this.webhooks.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete webhook subscription' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.webhooks.delete(id, req.user.organizationId);
  }
}
