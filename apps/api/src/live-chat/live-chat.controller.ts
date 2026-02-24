import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LiveChatService } from './live-chat.service';

@Controller('live-chat')
export class LiveChatController {
  constructor(private liveChatService: LiveChatService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Request() req: any) {
    return this.liveChatService.getStats(req.user.organizationId);
  }

  @Get('queued')
  @UseGuards(JwtAuthGuard)
  async getQueuedSessions(@Request() req: any) {
    return this.liveChatService.getQueuedSessions(req.user.organizationId);
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActiveSessions(@Request() req: any, @Query('agentId') agentId?: string) {
    return this.liveChatService.getActiveSessions(req.user.organizationId, agentId);
  }

  @Get('ended')
  @UseGuards(JwtAuthGuard)
  async getEndedSessions(@Request() req: any, @Query('limit') limit?: string) {
    return this.liveChatService.getEndedSessions(
      req.user.organizationId,
      limit ? parseInt(limit) : 50,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getSession(@Param('id') sessionId: string) {
    return this.liveChatService.getSession(sessionId);
  }

  @Post(':id/accept')
  @UseGuards(JwtAuthGuard)
  async acceptSession(@Param('id') sessionId: string, @Request() req: any) {
    return this.liveChatService.acceptSession(sessionId, req.user.id);
  }

  @Post(':id/end')
  @UseGuards(JwtAuthGuard)
  async endSession(
    @Param('id') sessionId: string,
    @Body() body: { rating?: number; feedback?: string },
  ) {
    return this.liveChatService.endSession(sessionId, body.rating, body.feedback);
  }

  @Post(':id/convert')
  @UseGuards(JwtAuthGuard)
  async convertToTicket(@Param('id') sessionId: string, @Request() req: any) {
    return this.liveChatService.convertToTicket(sessionId, req.user.id);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(@Param('id') sessionId: string, @Query('after') after?: string) {
    return this.liveChatService.getMessages(sessionId, after);
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Param('id') sessionId: string,
    @Body() body: { content: string },
    @Request() req: any,
  ) {
    return this.liveChatService.sendMessage({
      sessionId,
      content: body.content,
      senderType: 'agent',
      senderName: req.user.name,
    });
  }
}

@Controller('public/live-chat')
export class PublicLiveChatController {
  constructor(private liveChatService: LiveChatService) {}

  @Post('session')
  async createSession(
    @Body() body: {
      organizationId: string;
      visitorName?: string;
      visitorEmail?: string;
      pageUrl?: string;
      pageTitle?: string;
    },
  ) {
    return this.liveChatService.createSession(body.organizationId, {
      visitorName: body.visitorName,
      visitorEmail: body.visitorEmail,
      pageUrl: body.pageUrl,
      pageTitle: body.pageTitle,
    });
  }

  @Get('session/:id')
  async getSession(@Param('id') sessionId: string) {
    return this.liveChatService.getSession(sessionId);
  }

  @Post('session/:id/message')
  async sendMessage(
    @Param('id') sessionId: string,
    @Body() body: { content: string; senderName?: string },
  ) {
    return this.liveChatService.sendMessage({
      sessionId,
      content: body.content,
      senderType: 'visitor',
      senderName: body.senderName,
    });
  }

  @Get('session/:id/messages')
  async getMessages(@Param('id') sessionId: string, @Query('after') after?: string) {
    return this.liveChatService.getMessages(sessionId, after);
  }

  @Post('session/:id/end')
  async endSession(
    @Param('id') sessionId: string,
    @Body() body: { rating?: number; feedback?: string },
  ) {
    return this.liveChatService.endSession(sessionId, body.rating, body.feedback);
  }
}
