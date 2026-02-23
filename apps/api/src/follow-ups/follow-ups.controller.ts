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
import { FollowUpsService } from './follow-ups.service';

@Controller('follow-ups')
@UseGuards(JwtAuthGuard)
export class FollowUpsController {
  constructor(private followUpsService: FollowUpsService) {}

  @Post()
  async createFollowUp(
    @Request() req: any,
    @Body() body: { ticketId: string; type: string; remindAt: string; note?: string },
  ) {
    return this.followUpsService.createFollowUp({
      ticketId: body.ticketId,
      createdById: req.user.id,
      type: body.type,
      remindAt: new Date(body.remindAt),
      note: body.note,
    });
  }

  @Get()
  async getPendingFollowUps(
    @Request() req: any,
    @Query('pending') pending?: string,
    @Query('upcoming') upcoming?: string,
    @Query('hours') hours?: string,
  ) {
    if (upcoming === 'true') {
      return this.followUpsService.findUpcoming({
        userId: req.user.id,
        hours: hours ? parseInt(hours) : 24,
      });
    }

    return this.followUpsService.findPending({ userId: req.user.id });
  }

  @Get('ticket/:ticketId')
  async getTicketFollowUps(@Param('ticketId') ticketId: string) {
    return this.followUpsService.findByTicket(ticketId);
  }

  @Put(':id')
  async updateFollowUp(
    @Param('id') followUpId: string,
    @Body() body: { remindAt?: string; note?: string; type?: string },
  ) {
    const data: any = {};
    if (body.remindAt) data.remindAt = new Date(body.remindAt);
    if (body.note) data.note = body.note;
    if (body.type) data.type = body.type;

    return this.followUpsService.updateFollowUp(followUpId, data);
  }

  @Post(':id/complete')
  async completeFollowUp(@Param('id') followUpId: string, @Request() req: any) {
    return this.followUpsService.completeFollowUp(followUpId, req.user.id);
  }

  @Delete(':id')
  async deleteFollowUp(@Param('id') followUpId: string) {
    return this.followUpsService.deleteFollowUp(followUpId);
  }
}

@Controller('snoozes')
@UseGuards(JwtAuthGuard)
export class SnoozesController {
  constructor(private followUpsService: FollowUpsService) {}

  @Post()
  async snoozeTicket(
    @Request() req: any,
    @Body() body: { ticketId: string; snoozedUntil: string; reason?: string },
  ) {
    return this.followUpsService.snoozeTicket({
      ticketId: body.ticketId,
      snoozedById: req.user.id,
      snoozedUntil: new Date(body.snoozedUntil),
      reason: body.reason,
    });
  }

  @Get()
  async getActiveSnoozes() {
    return this.followUpsService.findActiveSnoozes();
  }

  @Get('ticket/:ticketId')
  async getTicketSnoozeHistory(@Param('ticketId') ticketId: string) {
    return this.followUpsService.getTicketSnoozeHistory(ticketId);
  }

  @Post(':id/unsnooze')
  async unsnoozeTicket(@Param('id') snoozeId: string) {
    return this.followUpsService.unsnoozeTicket(snoozeId);
  }
}
