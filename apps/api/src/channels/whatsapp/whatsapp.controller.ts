import { Controller, Post, Get, Body, Param, Query, UseGuards, Request, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WhatsAppService } from './whatsapp.service';

@Controller('channels/whatsapp')
export class WhatsAppController {
  constructor(private whatsAppService: WhatsAppService) {}

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    return this.whatsAppService.handleWebhook(payload);
  }

  @Get('webhook')
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const isValid = await this.whatsAppService.verifyWebhookMode(mode, token);
    if (isValid) {
      return challenge;
    }
    return { error: 'Invalid verification token' };
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Request() req: any,
    @Body() body: { to: string; message: string },
  ) {
    return this.whatsAppService.sendMessage(body.to, body.message, req.user.organizationId);
  }

  @Post('send-template')
  @UseGuards(JwtAuthGuard)
  async sendTemplate(
    @Request() req: any,
    @Body() body: { to: string; templateName: string; components?: any[] },
  ) {
    return this.whatsAppService.sendTemplateMessage(
      body.to,
      body.templateName,
      req.user.organizationId,
      body.components,
    );
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard)
  async getTemplates(@Request() req: any) {
    return this.whatsAppService.getTemplates(req.user.organizationId);
  }
}
