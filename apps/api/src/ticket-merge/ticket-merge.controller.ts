import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketMergeService } from './ticket-merge.service';

@Controller('ticket-merge')
@UseGuards(JwtAuthGuard)
export class TicketMergeController {
  constructor(private ticketMergeService: TicketMergeService) {}

  @Post('merge')
  async mergeTickets(
    @Request() req: any,
    @Body() body: { primaryTicketId: string; ticketIds: string[]; reason?: string }
  ) {
    return this.ticketMergeService.mergeTickets(
      body.primaryTicketId,
      body.ticketIds,
      req.user.id,
      body.reason
    );
  }

  @Post('unmerge/:ticketId')
  async unmergeTicket(@Param('ticketId') ticketId: string, @Request() req: any) {
    return this.ticketMergeService.unmergeTicket(ticketId, req.user.id);
  }

  @Get('history/:ticketId')
  async getMergeHistory(@Param('ticketId') ticketId: string) {
    return this.ticketMergeService.getMergeHistory(ticketId);
  }

  @Get('duplicates/:ticketId')
  async findDuplicates(@Param('ticketId') ticketId: string) {
    return this.ticketMergeService.findPotentialDuplicates(ticketId);
  }
}
