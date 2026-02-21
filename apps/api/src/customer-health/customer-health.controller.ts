import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CustomerHealthService } from './customer-health.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('customer-health')
@UseGuards(JwtAuthGuard)
export class CustomerHealthController {
  constructor(
    private customerHealthService: CustomerHealthService,
    private prisma: PrismaService,
  ) {}

  @Get('stats')
  async getOrganizationStats(@Request() req: any) {
    return this.customerHealthService.getOrganizationHealthStats(req.user.organizationId);
  }

  @Get('at-risk')
  async getAtRiskCustomers(@Request() req: any) {
    return this.customerHealthService.getAtRiskCustomers(req.user.organizationId);
  }

  @Get('profile/:profileId')
  async getProfile(@Param('profileId') profileId: string) {
    return this.prisma.customerProfile.findUnique({
      where: { id: profileId },
      include: {
        tickets: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        interactions: {
          orderBy: { occurredAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  @Post('profile/:profileId/calculate')
  async calculateScore(@Param('profileId') profileId: string) {
    const score = await this.customerHealthService.calculateHealthScore(profileId);
    return { score };
  }

  @Get('profile/:profileId/history')
  async getHistory(
    @Param('profileId') profileId: string,
    @Query('days') days?: string
  ) {
    return this.customerHealthService.getHealthHistory(
      profileId,
      days ? parseInt(days) : 30
    );
  }

  @Get('profile/:profileId/interactions')
  async getInteractions(
    @Param('profileId') profileId: string,
    @Query('limit') limit?: string
  ) {
    return this.customerHealthService.getInteractions(
      profileId,
      limit ? parseInt(limit) : 20
    );
  }

  @Post('profile/:profileId/interaction')
  async recordInteraction(
    @Param('profileId') profileId: string,
    @Body() body: { type: string; summary: string; ticketId?: string; sentiment?: number }
  ) {
    await this.customerHealthService.recordInteraction(
      profileId,
      body.type,
      body.summary,
      body.ticketId,
      body.sentiment
    );
    return { success: true };
  }
}
