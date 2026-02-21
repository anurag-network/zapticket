import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CSATService } from './csat.service';

@Controller('csat')
export class CSATController {
  constructor(private csatService: CSATService) {}

  @Post('surveys')
  @UseGuards(JwtAuthGuard)
  async createSurvey(
    @Request() req: any,
    @Body() body: { ticketId: string; customerId?: string }
  ) {
    return this.csatService.createSurvey(
      body.ticketId,
      req.user.organizationId,
      body.customerId
    );
  }

  @Post('surveys/:id/respond')
  async submitResponse(
    @Param('id') surveyId: string,
    @Body() body: { rating: number; comment?: string; customerId?: string }
  ) {
    return this.csatService.submitResponse(
      surveyId,
      body.rating,
      body.comment,
      body.customerId
    );
  }

  @Get('surveys/:id')
  async getSurvey(@Param('id') surveyId: string) {
    return this.csatService.getSurvey(surveyId);
  }

  @Get('ticket/:ticketId')
  @UseGuards(JwtAuthGuard)
  async getTicketSurvey(@Param('ticketId') ticketId: string) {
    return this.csatService.getTicketSurvey(ticketId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(
    @Request() req: any,
    @Query('days') days?: string
  ) {
    return this.csatService.getOrganizationStats(
      req.user.organizationId,
      days ? parseInt(days) : 30
    );
  }

  @Get('responses')
  @UseGuards(JwtAuthGuard)
  async getRecentResponses(
    @Request() req: any,
    @Query('limit') limit?: string
  ) {
    return this.csatService.getRecentResponses(
      req.user.organizationId,
      limit ? parseInt(limit) : 20
    );
  }
}
