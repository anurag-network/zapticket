import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SentimentService } from './sentiment.service';

@Controller('sentiment')
@UseGuards(JwtAuthGuard)
export class SentimentController {
  constructor(private sentimentService: SentimentService) {}

  @Post('analyze/ticket/:ticketId')
  async analyzeTicket(@Param('ticketId') ticketId: string) {
    return this.sentimentService.analyzeTicket(ticketId);
  }

  @Post('analyze/message/:messageId')
  async analyzeMessage(@Param('messageId') messageId: string) {
    return this.sentimentService.analyzeMessage(messageId);
  }

  @Get('ticket/:ticketId/history')
  async getTicketHistory(@Param('ticketId') ticketId: string) {
    return this.sentimentService.getTicketSentimentHistory(ticketId);
  }

  @Get('stats')
  async getOrganizationStats(@Request() req: any) {
    return this.sentimentService.getOrganizationSentimentStats(req.user.organizationId);
  }
}
