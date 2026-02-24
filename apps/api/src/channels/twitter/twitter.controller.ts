import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TwitterService } from './twitter.service';
import { createHmac } from 'crypto';

@Controller('channels/twitter')
export class TwitterController {
  constructor(private twitterService: TwitterService) {}

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    return this.twitterService.handleWebhook(payload);
  }

  @Get('webhook')
  async verifyWebhook(@Query('crc_token') crcToken: string) {
    const signature = await this.twitterService.verifyWebhook(crcToken);
    return {
      response_token: `sha256=${signature}`,
    };
  }

  @Post('send-dm')
  @UseGuards(JwtAuthGuard)
  async sendDM(
    @Request() req: any,
    @Body() body: { userId: string; message: string },
  ) {
    return this.twitterService.sendDM(body.userId, body.message, req.user.organizationId);
  }

  @Post('reply')
  @UseGuards(JwtAuthGuard)
  async replyToTweet(
    @Request() req: any,
    @Body() body: { tweetId: string; message: string },
  ) {
    return this.twitterService.replyToTweet(body.tweetId, body.message, req.user.organizationId);
  }
}
