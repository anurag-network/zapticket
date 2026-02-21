import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivityLogService } from './activity-log.service';

@Controller('activity-log')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private activityLogService: ActivityLogService) {}

  @Get('ticket/:ticketId')
  async getTicketActivity(
    @Param('ticketId') ticketId: string,
    @Query('limit') limit?: string
  ) {
    return this.activityLogService.getTicketActivity(
      ticketId,
      limit ? parseInt(limit) : 50
    );
  }

  @Get('organization')
  async getOrganizationActivity(
    @Request() req: any,
    @Query('limit') limit?: string
  ) {
    return this.activityLogService.getOrganizationActivity(
      req.user.organizationId,
      limit ? parseInt(limit) : 100
    );
  }
}
