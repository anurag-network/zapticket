import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MentionsService } from './mentions.service';

@Controller('mentions')
@UseGuards(JwtAuthGuard)
export class MentionsController {
  constructor(private mentionsService: MentionsService) {}

  @Get()
  async getUserMentions(
    @Request() req: any,
    @Query('unread') unread?: string,
    @Query('limit') limit?: string,
  ) {
    return this.mentionsService.findUserMentions(req.user.id, {
      unreadOnly: unread === 'true',
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.mentionsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Get('ticket/:ticketId')
  async getTicketMentions(@Param('ticketId') ticketId: string) {
    return this.mentionsService.findByTicket(ticketId);
  }

  @Post(':id/read')
  async markAsRead(@Param('id') mentionId: string, @Request() req: any) {
    return this.mentionsService.markAsRead(mentionId, req.user.id);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.mentionsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  async deleteMention(@Param('id') mentionId: string) {
    return this.mentionsService.delete(mentionId);
  }
}
