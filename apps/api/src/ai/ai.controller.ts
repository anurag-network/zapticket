import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AISummarizationService } from './ai-summarization.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AISummarizationController {
  constructor(private summarizationService: AISummarizationService) {}

  @Post('summarize/ticket/:ticketId')
  async summarizeTicket(
    @Param('ticketId') ticketId: string,
    @Request() req: any,
  ) {
    return this.summarizationService.summarizeTicket(ticketId);
  }

  @Get('summary/ticket/:ticketId')
  async getCachedSummary(@Param('ticketId') ticketId: string) {
    return this.summarizationService.getCachedSummary(ticketId);
  }
}
