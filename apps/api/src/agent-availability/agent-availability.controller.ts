import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgentAvailabilityService } from './agent-availability.service';
import { AgentStatus } from '@prisma/client';

@Controller('agent-availability')
@UseGuards(JwtAuthGuard)
export class AgentAvailabilityController {
  constructor(private availabilityService: AgentAvailabilityService) {}

  @Post('status')
  async updateStatus(
    @Request() req: any,
    @Body() body: { status: AgentStatus; statusMessage?: string }
  ) {
    return this.availabilityService.updateStatus(
      req.user.id,
      req.user.organizationId,
      body.status,
      body.statusMessage
    );
  }

  @Get('me')
  async getMyStatus(@Request() req: any) {
    return this.availabilityService.getAgentStatus(req.user.id);
  }

  @Get('agents')
  async getOrganizationAgents(@Request() req: any) {
    return this.availabilityService.getOrganizationAgents(req.user.organizationId);
  }

  @Get('online')
  async getOnlineAgents(@Request() req: any) {
    return this.availabilityService.getOnlineAgents(req.user.organizationId);
  }

  @Post('heartbeat')
  async heartbeat(@Request() req: any) {
    await this.availabilityService.heartbeat(req.user.id);
    return { success: true };
  }

  @Get('stats/:agentId')
  async getAgentStats(
    @Param('agentId') agentId: string,
    @Query('days') days?: string
  ) {
    return this.availabilityService.getAgentStats(
      agentId,
      days ? parseInt(days) : 7
    );
  }
}
