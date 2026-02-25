import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TimeEntriesService } from './time-entries.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('Time Entries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TimeEntriesController {
  constructor(private timeEntries: TimeEntriesService) {}

  @Get('tickets/:ticketId/time-entries')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get time entries for a ticket' })
  getByTicket(@Param('ticketId') ticketId: string) {
    return this.timeEntries.findByTicket(ticketId);
  }

  @Get('time-entries')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get time entries for current user' })
  getMyEntries(
    @Req() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.timeEntries.findByUser(
      req.user.id,
      req.user.organizationId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('time-entries/active')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get active timer' })
  getActiveTimer(@Req() req: any) {
    return this.timeEntries.getActiveTimer(req.user.id);
  }

  @Post('tickets/:ticketId/time-entries')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Start time tracking for a ticket' })
  startTimer(
    @Param('ticketId') ticketId: string,
    @Req() req: any,
    @Body() body: { description?: string; action?: 'start' | 'stop' }
  ) {
    if (body.action === 'stop') {
      return this.timeEntries.stopTimer(ticketId, req.user.id);
    }
    return this.timeEntries.startTimer(ticketId, req.user.id, req.user.organizationId, body.description);
  }

  @Post('time-entries')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Create a time entry manually' })
  create(@Req() req: any, @Body() data: {
    ticketId: string;
    description?: string;
    startTime: Date;
    endTime?: Date;
    billable?: boolean;
  }) {
    return this.timeEntries.create({
      ...data,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });
  }

  @Patch('time-entries/:id')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Update a time entry' })
  update(@Param('id') id: string, @Req() req: any, @Body() data: {
    description?: string;
    billable?: boolean;
    startTime?: Date;
    endTime?: Date;
  }) {
    return this.timeEntries.update(id, req.user.id, req.user.organizationId, data);
  }

  @Delete('time-entries/:id')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Delete a time entry' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.timeEntries.delete(id, req.user.id, req.user.organizationId);
  }
}
