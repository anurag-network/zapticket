import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FacebookService } from './facebook.service';

@Controller('channels/facebook')
export class FacebookController {
  constructor(private facebookService: FacebookService) {}

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    return this.facebookService.handleWebhook(payload);
  }

  @Get('webhook')
  async verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const isValid = await this.facebookService.verifyWebhook(mode, token);
    if (isValid) {
      return challenge;
    }
    return { error: 'Invalid verification token' };
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Request() req: any,
    @Body() body: { recipientId: string; message: string },
  ) {
    return this.facebookService.sendMessage(
      body.recipientId,
      body.message,
      req.user.organizationId,
    );
  }
}
