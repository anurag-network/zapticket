import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportingService } from './reporting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('reporting')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reporting')
export class ReportingController {
  constructor(private reporting: ReportingService) {}

  @Get('metrics')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get dashboard metrics' })
  getMetrics(@Req() req: any) {
    return this.reporting.getDashboardMetrics(req.user.organizationId);
  }

  @Get('ticket-stats')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get ticket statistics' })
  getTicketStats(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const dateRange = startDate && endDate
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined;
    
    return this.reporting.getTicketStats(req.user.organizationId, dateRange);
  }

  @Get('tickets-over-time')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get tickets over time' })
  getTicketsOverTime(@Req() req: any, @Query('days') days?: string) {
    return this.reporting.getTicketsOverTime(
      req.user.organizationId,
      days ? parseInt(days) : 30
    );
  }

  @Get('agent-performance')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get agent performance' })
  getAgentPerformance(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const dateRange = startDate && endDate
      ? { start: new Date(startDate), end: new Date(endDate) }
      : undefined;
    
    return this.reporting.getAgentPerformance(req.user.organizationId, dateRange);
  }

  @Get('category-breakdown')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get KB category breakdown' })
  getCategoryBreakdown(@Req() req: any) {
    return this.reporting.getCategoryBreakdown(req.user.organizationId);
  }
}
