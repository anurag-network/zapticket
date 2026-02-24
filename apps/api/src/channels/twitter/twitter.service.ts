import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwitterService {
  private readonly logger = new Logger(TwitterService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getOrCreateChannel(organizationId: string): Promise<any> {
    let channel = await this.prisma.channel.findFirst({
      where: { organizationId, type: 'TWITTER' },
    });

    if (!channel) {
      channel = await this.prisma.channel.create({
        data: {
          organizationId,
          type: 'TWITTER',
          name: 'Twitter/X',
          config: {},
        },
      });
    }

    return channel;
  }

  async sendDM(userId: string, message: string, organizationId: string): Promise<any> {
    const channel = await this.getOrCreateChannel(organizationId);
    
    const bearerToken = this.configService.get('TWITTER_BEARER_TOKEN');
    const apiKey = this.configService.get('TWITTER_API_KEY');
    const apiSecret = this.configService.get('TWITTER_API_SECRET');

    if (!bearerToken) {
      return {
        success: true,
        messageId: `mock_twitter_${Date.now()}`,
        status: 'queued',
        mock: true,
      };
    }

    try {
      const response = await fetch(
        'https://api.twitter.com/2/dm_conversations',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            participant: { id: userId },
            message: { text: message },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new BadRequestException(`Twitter API error: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.data?.dm_conversation_id,
      };
    } catch (error) {
      this.logger.error(`Failed to send DM: ${error.message}`);
      throw new BadRequestException(`Failed to send DM: ${error.message}`);
    }
  }

  async replyToTweet(tweetId: string, message: string, organizationId: string): Promise<any> {
    const channel = await this.getOrCreateChannel(organizationId);
    
    const bearerToken = this.configService.get('TWITTER_BEARER_TOKEN');

    if (!bearerToken) {
      return {
        success: true,
        tweetId: `mock_tweet_${Date.now()}`,
        mock: true,
      };
    }

    try {
      const response = await fetch(
        'https://api.twitter.com/2/tweets',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reply: { in_reply_to_tweet_id: tweetId },
            text: message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new BadRequestException(`Twitter API error: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        tweetId: result.data?.id,
      };
    } catch (error) {
      this.logger.error(`Failed to reply to tweet: ${error.message}`);
      throw new BadRequestException(`Failed to reply: ${error.message}`);
    }
  }

  async handleWebhook(payload: any): Promise<any> {
    const tweetCreateEvents = payload?.tweet_create_events;
    const dmEvents = payload?.dm_events;

    if (tweetCreateEvents && tweetCreateEvents.length > 0) {
      for (const event of tweetCreateEvents) {
        await this.processTweet(event);
      }
    }

    if (dmEvents && dmEvents.length > 0) {
      for (const event of dmEvents) {
        await this.processDM(event);
      }
    }

    return { received: true };
  }

  private async processTweet(event: any): Promise<void> {
    const tweetId = event.id;
    const userId = event.user?.id;
    const text = event.text;
    const screenName = event.user?.screen_name;

    if (event.in_reply_to_status_id) {
      return;
    }

    const organization = await this.prisma.organization.findFirst({
      where: {
        settings: {
          path: ['twitter', 'screenName'],
          equals: screenName,
        },
      },
    }).catch(() => null);

    if (!organization) {
      return;
    }

    const conversation = await this.prisma.chatConversation.create({
      data: {
        organizationId: organization.id,
        status: 'ACTIVE',
      },
    });

    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        content: `Tweet from @${screenName}: ${text}`,
        isBot: false,
      },
    });
  }

  private async processDM(event: any): Promise<void> {
    const senderId = event.message_create?.sender_id;
    const text = event.message_create?.message_data?.text;

    if (!senderId || !text) return;

    const organization = await this.prisma.organization.findFirst({
      where: {
        settings: {
          path: ['twitter', 'userId'],
          equals: senderId,
        },
      },
    }).catch(() => null);

    if (!organization) {
      return;
    }

    const conversation = await this.prisma.chatConversation.create({
      data: {
        organizationId: organization.id,
        status: 'ACTIVE',
      },
    });

    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        content: `DM: ${text}`,
        isBot: false,
      },
    });
  }

  async verifyWebhook(crcToken: string): Promise<string> {
    const apiSecret = this.configService.get('TWITTER_API_SECRET');
    if (!apiSecret) {
      return '';
    }

    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(crcToken)
      .digest('base64');

    return signature;
  }
}
