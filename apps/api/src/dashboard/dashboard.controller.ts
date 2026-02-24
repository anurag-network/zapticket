import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('metrics')
  async getMetrics(@Request() req: any) {
    return this.dashboardService.getMetrics(req.user.organizationId);
  }

  @Get('leaderboard')
  async getLeaderboard(@Request() req: any) {
    return this.dashboardService.getAgentLeaderboard(req.user.organizationId);
  }

  @Get('trends')
  async getTrends(
    @Request() req: any,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getTrends(req.user.organizationId, days ? parseInt(days) : 30);
  }
}
