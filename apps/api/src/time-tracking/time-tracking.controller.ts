import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TimeTrackingService } from './time-tracking.service';

@Controller('time-tracking')
@UseGuards(JwtAuthGuard)
export class TimeTrackingController {
  constructor(private timeTrackingService: TimeTrackingService) {}

  @Post('entries')
  async createEntry(
    @Request() req: any,
    @Body() body: { ticketId: string; description?: string; billable?: boolean; startTime?: string; endTime?: string; duration?: number },
  ) {
    return this.timeTrackingService.createEntry(req.user.organizationId, req.user.id, {
      ticketId: body.ticketId,
      description: body.description,
      billable: body.billable,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      duration: body.duration,
    });
  }

  @Post('start')
  async startTimer(
    @Request() req: any,
    @Body() body: { ticketId: string; description?: string },
  ) {
    return this.timeTrackingService.startTimer(
      req.user.organizationId,
      req.user.id,
      body.ticketId,
      body.description,
    );
  }

  @Post('stop/:id')
  async stopTimer(
    @Param('id') entryId: string,
    @Request() req: any,
    @Body() body: { description?: string },
  ) {
    return this.timeTrackingService.stopTimer(entryId, req.user.id, body.description);
  }

  @Get('active')
  async getActiveTimer(@Request() req: any) {
    return this.timeTrackingService.getActiveTimer(req.user.id);
  }

  @Get('entries')
  async getEntries(
    @Request() req: any,
    @Query('ticketId') ticketId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('billable') billable?: string,
  ) {
    if (ticketId) {
      return this.timeTrackingService.findByTicket(ticketId);
    }

    if (userId || startDate || endDate) {
      return this.timeTrackingService.findByOrganization(
        req.user.organizationId,
        {
          userId,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          billable: billable === 'true' ? true : billable === 'false' ? false : undefined,
        },
      );
    }

    return this.timeTrackingService.findByUser(req.user.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('entries/:id')
  async getEntry(@Param('id') entryId: string, @Request() req: any) {
    return this.timeTrackingService.findByUser(req.user.id);
  }

  @Put('entries/:id')
  async updateEntry(
    @Param('id') entryId: string,
    @Request() req: any,
    @Body() body: { description?: string; billable?: boolean; endTime?: string },
  ) {
    return this.timeTrackingService.updateEntry(entryId, req.user.id, {
      description: body.description,
      billable: body.billable,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
    });
  }

  @Delete('entries/:id')
  async deleteEntry(@Param('id') entryId: string, @Request() req: any) {
    return this.timeTrackingService.deleteEntry(entryId, req.user.id);
  }

  @Get('summary/ticket/:ticketId')
  async getTicketTimeSummary(@Param('ticketId') ticketId: string) {
    return this.timeTrackingService.getTicketTimeSummary(ticketId);
  }

  @Get('summary/user')
  async getUserTimeSummary(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.timeTrackingService.getUserTimeSummary(
      req.user.id,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('report')
  async getReport(
    @Request() req: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('groupBy') groupBy?: 'user' | 'ticket',
  ) {
    return this.timeTrackingService.getOrganizationTimeReport(
      req.user.organizationId,
      new Date(startDate),
      new Date(endDate),
      groupBy || 'user',
    );
  }
}
