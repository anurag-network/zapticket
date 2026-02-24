import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SMSService } from './sms.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('channels/sms')
export class SMSController {
  constructor(
    private smsService: SMSService,
    private prisma: PrismaService,
  ) {}

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    return this.smsService.handleIncomingWebhook(payload);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendSMS(
    @Request() req: any,
    @Body() body: { to: string; message: string },
  ) {
    return this.smsService.sendSMS(body.to, body.message, req.user.organizationId);
  }

  @Get('messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Request() req: any,
    @Query('phone') phone?: string,
  ) {
    return this.smsService.getMessages(req.user.organizationId, phone);
  }

  @Post('link-ticket')
  @UseGuards(JwtAuthGuard)
  async linkToTicket(
    @Body() body: { conversationId: string; ticketId: string },
  ) {
    return this.smsService.linkToTicket(body.conversationId, body.ticketId);
  }
}

@Controller('public/sms')
export class PublicSMSController {
  constructor(private smsService: SMSService) {}

  @Post('webhook')
  async handleIncoming(@Body() payload: any) {
    return this.smsService.handleIncomingWebhook(payload);
  }
}
