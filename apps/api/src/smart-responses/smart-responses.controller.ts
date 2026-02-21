import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SmartResponseService } from './smart-responses.service';

@Controller('smart-responses')
@UseGuards(JwtAuthGuard)
export class SmartResponseController {
  constructor(private smartResponseService: SmartResponseService) {}

  @Get('ticket/:ticketId')
  async getSuggestions(@Param('ticketId') ticketId: string) {
    return this.smartResponseService.getSuggestions(ticketId);
  }

  @Get('ticket/:ticketId/stored')
  async getStoredSuggestions(@Param('ticketId') ticketId: string) {
    return this.smartResponseService.getStoredSuggestions(ticketId);
  }

  @Post('suggestion/:suggestionId/used')
  async markUsed(@Param('suggestionId') suggestionId: string) {
    await this.smartResponseService.markSuggestionUsed(suggestionId);
    return { success: true };
  }
}
