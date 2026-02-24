import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface SMSMessage {
  id: string;
  body: string;
  from: string;
  to: string;
  status: string;
  direction: 'inbound' | 'outbound';
  ticketId?: string;
  createdAt: Date;
}

@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name);
  private twilioClient: any;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    
    if (accountSid && authToken) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(accountSid, authToken);
      } catch (error) {
        this.logger.warn('Twilio SDK not available');
      }
    }
  }

  async getOrCreateChannel(organizationId: string): Promise<any> {
    let channel = await this.prisma.channel.findFirst({
      where: { organizationId, type: 'SMS' },
    });

    if (!channel) {
      channel = await this.prisma.channel.create({
        data: {
          organizationId,
          type: 'SMS',
          name: 'SMS',
          config: {},
        },
      });
    }

    return channel;
  }

  async sendSMS(to: string, body: string, organizationId: string): Promise<any> {
    const channel = await this.getOrCreateChannel(organizationId);
    
    const message = await this.prisma.message.create({
      data: {
        content: body,
        type: 'REPLY',
        ticketId: undefined,
        authorId: organizationId,
      },
    });

    if (this.twilioClient) {
      try {
        const from = this.configService.get('TWILIO_PHONE_NUMBER');
        const result = await this.twilioClient.messages.create({
          body,
          from,
          to,
        });

        await this.prisma.message.update({
          where: { id: message.id },
          data: { content: `SMS sent via Twilio: ${body}` },
        });

        return {
          success: true,
          messageId: result.sid,
          status: result.status,
        };
      } catch (error) {
        this.logger.error(`Failed to send SMS: ${error.message}`);
        throw new BadRequestException(`Failed to send SMS: ${error.message}`);
      }
    }

    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      status: 'queued',
      mock: true,
    };
  }

  async handleIncomingWebhook(payload: any): Promise<any> {
    const { From, Body, MessageSid, AccountSid } = payload;

    const organization = await this.prisma.organization.findFirst({
      where: {
        settings: {
          path: ['twilio', 'phoneNumber'],
          equals: payload.To || payload.From,
        },
      },
    }).catch(() => null);

    if (!organization) {
      this.logger.warn('No organization found for incoming SMS');
      return { received: true };
    }

    const channel = await this.getOrCreateChannel(organization.id);

    const existingConversation = await this.prisma.chatConversation.findFirst({
      where: {
        organizationId: organization.id,
        OR: [
          { visitorPhone: From },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    let conversation;
    if (existingConversation) {
      conversation = existingConversation;
    } else {
      conversation = await this.prisma.chatConversation.create({
        data: {
          organizationId: organization.id,
          chatbotConfigId: undefined,
          visitorPhone: From,
          status: 'ACTIVE',
        },
      });
    }

    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        content: Body,
        isBot: false,
      },
    });

    return { received: true, conversationId: conversation.id };
  }

  async getMessages(organizationId: string, phone?: string): Promise<SMSMessage[]> {
    const where: any = { organizationId };

    return [];
  }

  async linkToTicket(conversationId: string, ticketId: string): Promise<void> {
    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { ticketId },
    });
  }
}
