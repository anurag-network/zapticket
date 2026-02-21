import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SLAService } from './sla.service';
import { SLAPriority } from '@prisma/client';

@Controller('sla')
@UseGuards(JwtAuthGuard)
export class SLAController {
  constructor(private slaService: SLAService) {}

  @Get('policies')
  async getPolicies(@Request() req: any) {
    return this.slaService.getPolicies(req.user.organizationId);
  }

  @Post('policies')
  async createPolicy(
    @Request() req: any,
    @Body() body: {
      name: string;
      description?: string;
      priority: SLAPriority;
      responseTimeMinutes: number;
      resolutionTimeMinutes: number;
      businessHoursOnly?: boolean;
    }
  ) {
    return this.slaService.createPolicy(
      req.user.organizationId,
      body.name,
      body.priority,
      body.responseTimeMinutes,
      body.resolutionTimeMinutes,
      body.description,
      body.businessHoursOnly || false
    );
  }

  @Put('policies/:id')
  async updatePolicy(
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      description: string;
      responseTimeMinutes: number;
      resolutionTimeMinutes: number;
      businessHoursOnly: boolean;
      active: boolean;
    }>
  ) {
    return this.slaService.updatePolicy(id, body);
  }

  @Delete('policies/:id')
  async deletePolicy(@Param('id') id: string) {
    await this.slaService.deletePolicy(id);
    return { success: true };
  }

  @Get('check/:ticketId')
  async checkTicketSLA(@Param('ticketId') ticketId: string) {
    return this.slaService.checkTicketSLA(ticketId);
  }

  @Get('breaches')
  async getBreaches(
    @Request() req: any,
    @Query('days') days?: string
  ) {
    return this.slaService.getBreaches(
      req.user.organizationId,
      days ? parseInt(days) : 7
    );
  }

  @Post('breaches/:id/acknowledge')
  async acknowledgeBreach(@Param('id') breachId: string, @Request() req: any) {
    return this.slaService.acknowledgeBreach(breachId, req.user.id);
  }

  @Get('stats')
  async getStats(
    @Request() req: any,
    @Query('days') days?: string
  ) {
    return this.slaService.getSLAStats(
      req.user.organizationId,
      days ? parseInt(days) : 30
    );
  }
}
