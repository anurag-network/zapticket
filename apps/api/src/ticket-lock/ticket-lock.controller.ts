import { Controller, Post, Delete, Get, Param, UseGuards, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketLockService } from './ticket-lock.service';

@Controller('tickets/:ticketId/lock')
@UseGuards(JwtAuthGuard)
export class TicketLockController {
  constructor(private ticketLockService: TicketLockService) {}

  @Post()
  async acquireLock(
    @Param('ticketId') ticketId: string,
    @Request() req: any
  ) {
    const result = await this.ticketLockService.acquireLock(ticketId, req.user.id);
    return result;
  }

  @Delete()
  async releaseLock(
    @Param('ticketId') ticketId: string,
    @Request() req: any
  ) {
    await this.ticketLockService.releaseLock(ticketId, req.user.id);
    return { success: true };
  }

  @Get()
  async getLockStatus(@Param('ticketId') ticketId: string) {
    return this.ticketLockService.getLockStatus(ticketId);
  }

  @Post('force-release')
  async forceReleaseLock(
    @Param('ticketId') ticketId: string,
    @Request() req: any
  ) {
    await this.ticketLockService.forceReleaseLock(ticketId, req.user.id);
    return { success: true };
  }
}

@Controller('tickets/bulk-lock')
@UseGuards(JwtAuthGuard)
export class BulkTicketLockController {
  constructor(private ticketLockService: TicketLockService) {}

  @Post()
  async bulkAcquireLocks(
    @Body('ticketIds') ticketIds: string[],
    @Request() req: any
  ) {
    return this.ticketLockService.bulkAcquireLocks(ticketIds, req.user.id);
  }
}
