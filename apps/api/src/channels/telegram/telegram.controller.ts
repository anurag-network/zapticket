import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TelegramService } from './telegram.service';

@Controller('channels/telegram')
export class TelegramController {
  constructor(private telegramService: TelegramService) {}

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    return this.telegramService.handleWebhook(payload);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Request() req: any,
    @Body() body: { chatId: string; text: string },
  ) {
    return this.telegramService.sendMessage(body.chatId, body.text, req.user.organizationId);
  }

  @Post('send-keyboard')
  @UseGuards(JwtAuthGuard)
  async sendInlineKeyboard(
    @Request() req: any,
    @Body() body: { chatId: string; text: string; buttons: any[] },
  ) {
    return this.telegramService.sendInlineKeyboard(
      body.chatId,
      body.text,
      body.buttons,
      req.user.organizationId,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getBotInfo() {
    return this.telegramService.getMe();
  }
}
