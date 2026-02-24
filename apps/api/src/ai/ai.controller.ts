import { Controller, Post, Get, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AISummarizationService } from './ai-summarization.service';
import { AICategorizationService } from './ai-categorization.service';
import { PredictiveCSATService } from './predictive-csat.service';
import { TranslationService } from './translation.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AIController {
  constructor(
    private summarizationService: AISummarizationService,
    private categorizationService: AICategorizationService,
    private predictiveCSATService: PredictiveCSATService,
    private translationService: TranslationService,
  ) {}

  @Post('summarize/ticket/:ticketId')
  async summarizeTicket(@Param('ticketId') ticketId: string) {
    return this.summarizationService.summarizeTicket(ticketId);
  }

  @Get('summary/ticket/:ticketId')
  async getCachedSummary(@Param('ticketId') ticketId: string) {
    return this.summarizationService.getCachedSummary(ticketId);
  }

  @Post('categorize/ticket/:ticketId')
  async categorizeTicket(@Param('ticketId') ticketId: string) {
    return this.categorizationService.categorizeTicket(ticketId);
  }

  @Post('categorize/ticket/:ticketId/auto')
  async autoCategorizeTicket(@Param('ticketId') ticketId: string) {
    await this.categorizationService.autoCategorizeOnCreate(ticketId);
    return { success: true };
  }

  @Get('suggest-assignment/:ticketId')
  async suggestAssignment(@Param('ticketId') ticketId: string) {
    return this.categorizationService.suggestAssignment(ticketId);
  }

  @Post('predict-csat/ticket/:ticketId')
  async predictCSAT(@Param('ticketId') ticketId: string) {
    return this.predictiveCSATService.predictCSAT(ticketId);
  }

  @Get('at-risk-tickets')
  async getAtRiskTickets(@Request() req: any) {
    return this.predictiveCSATService.checkAtRiskTickets(req.user.organizationId);
  }

  @Post('csat/:ticketId/record')
  async recordCSAT(
    @Param('ticketId') ticketId: string,
    @Body('score') score: number,
  ) {
    await this.predictiveCSATService.recordActualCSAT(ticketId, score);
    return { success: true };
  }

  @Get('csat-trends')
  async getCSATTrends(
    @Request() req: any,
    @Query('days') days?: string,
  ) {
    return this.predictiveCSATService.getSatisfactionTrends(
      req.user.organizationId,
      days ? parseInt(days) : 30,
    );
  }

  @Post('translate')
  async translateText(
    @Body() body: { text: string; targetLanguage: string; sourceLanguage?: string },
  ) {
    return this.translationService.translateText(
      body.text,
      body.targetLanguage,
      body.sourceLanguage,
    );
  }

  @Get('detect-language')
  async detectLanguage(@Query('text') text: string) {
    const language = await this.translationService.detectLanguage(text);
    return { language };
  }

  @Post('translate/ticket/:ticketId')
  async translateTicketMessages(
    @Param('ticketId') ticketId: string,
    @Body('targetLanguage') targetLanguage: string,
  ) {
    await this.translationService.translateTicketMessages(ticketId, targetLanguage);
    return { success: true };
  }

  @Get('languages')
  async getSupportedLanguages() {
    return this.translationService.getSupportedLanguages();
  }
}
