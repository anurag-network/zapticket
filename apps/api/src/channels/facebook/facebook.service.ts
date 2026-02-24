import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FacebookService {
  private readonly logger = new Logger(FacebookService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getOrCreateChannel(organizationId: string): Promise<any> {
    let channel = await this.prisma.channel.findFirst({
      where: { organizationId, type: 'FACEBOOK' },
    });

    if (!channel) {
      channel = await this.prisma.channel.create({
        data: {
          organizationId,
          type: 'FACEBOOK',
          name: 'Facebook Messenger',
          config: {},
        },
      });
    }

    return channel;
  }

  async sendMessage(recipientId: string, message: string, organizationId: string): Promise<any> {
    const channel = await this.getOrCreateChannel(organizationId);
    
    const accessToken = this.configService.get('FACEBOOK_ACCESS_TOKEN');
    const pageId = this.configService.get('FACEBOOK_PAGE_ID');

    if (!accessToken || !pageId) {
      return {
        success: true,
        messageId: `mock_fb_${Date.now()}`,
        status: 'queued',
        mock: true,
      };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/messages?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient: { id: recipientId },
            message: { text: message },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new BadRequestException(`Facebook API error: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.message_id,
        recipientId,
      };
    } catch (error) {
      this.logger.error(`Failed to send Facebook message: ${error.message}`);
      throw new BadRequestException(`Failed to send message: ${error.message}`);
    }
  }

  async handleWebhook(payload: any): Promise<any> {
    const entry = payload.entry?.[0];
    const messaging = entry?.messaging?.[0];

    if (!messaging) {
      return { received: true };
    }

    const senderId = messaging.sender?.id;
    const message = messaging.message?.text;
    const postback = messaging.postback?.payload;

    if (!senderId) {
      return { received: true };
    }

    const organization = await this.prisma.organization.findFirst({
      where: {
        settings: {
          path: ['facebook', 'pageId'],
          equals: entry.id,
        },
      },
    }).catch(() => null);

    if (!organization) {
      this.logger.warn('No organization found for Facebook message');
      return { received: true };
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
        content: message || postback || '[Postback]',
        isBot: false,
      },
    });

    return { received: true, conversationId: conversation.id };
  }

  async verifyWebhook(mode: string, token: string): Promise<boolean> {
    const verifyToken = this.configService.get('FACEBOOK_WEBHOOK_VERIFY_TOKEN');
    return mode === 'subscribe' && token === verifyToken;
  }
}
