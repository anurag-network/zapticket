import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  type: string;
  content: string;
  mediaUrl?: string;
  timestamp: Date;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getOrCreateChannel(organizationId: string): Promise<any> {
    let channel = await this.prisma.channel.findFirst({
      where: { organizationId, type: 'WHATSAPP' },
    });

    if (!channel) {
      channel = await this.prisma.channel.create({
        data: {
          organizationId,
          type: 'WHATSAPP',
          name: 'WhatsApp',
          config: {},
        },
      });
    }

    return channel;
  }

  async sendMessage(to: string, message: string, organizationId: string, type: 'text' | 'template' = 'text'): Promise<any> {
    const channel = await this.getOrCreateChannel(organizationId);
    
    const accessToken = this.configService.get('META_ACCESS_TOKEN');
    const phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!accessToken || !phoneNumberId) {
      this.logger.warn('WhatsApp not configured - using mock mode');
      return {
        success: true,
        messageId: `mock_whatsapp_${Date.now()}`,
        status: 'queued',
        mock: true,
      };
    }

    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to,
        type: type,
      };

      if (type === 'text') {
        payload.text = { body: message };
      } else if (type === 'template') {
        payload.template = { name: message, language: { code: 'en_US' } };
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`WhatsApp API error: ${error}`);
        throw new BadRequestException(`WhatsApp API error: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.messages[0].id,
        status: 'sent',
      };
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`);
      throw new BadRequestException(`Failed to send message: ${error.message}`);
    }
  }

  async sendTemplateMessage(to: string, templateName: string, organizationId: string, components?: any[]): Promise<any> {
    const channel = await this.getOrCreateChannel(organizationId);
    
    const accessToken = this.configService.get('META_ACCESS_TOKEN');
    const phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID');

    if (!accessToken || !phoneNumberId) {
      return {
        success: true,
        messageId: `mock_template_${Date.now()}`,
        status: 'queued',
        mock: true,
      };
    }

    try {
      const payload: any = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
        },
      };

      if (components) {
        payload.template.components = components;
      }

      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new BadRequestException(`WhatsApp API error: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.messages[0].id,
        status: 'sent',
      };
    } catch (error) {
      this.logger.error(`Failed to send template: ${error.message}`);
      throw new BadRequestException(`Failed to send template: ${error.message}`);
    }
  }

  async handleWebhook(payload: any): Promise<any> {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const messages = changes?.value?.messages;

    if (!messages || messages.length === 0) {
      return { received: true };
    }

    for (const msg of messages) {
      await this.processIncomingMessage(entry, msg);
    }

    return { received: true };
  }

  private async processIncomingMessage(entry: any, msg: any): Promise<void> {
    const phoneNumberId = entry.changes?.[0]?.value?.metadata?.phone_number_id;
    const from = msg.from;
    const messageId = msg.id;
    const timestamp = new Date(parseInt(msg.timestamp) * 1000);

    let content = '';
    let type = msg.type;
    let mediaUrl: string | undefined;

    if (msg.text) {
      content = msg.text.body;
    } else if (msg.image) {
      content = '[Image]';
      mediaUrl = msg.image?.mime_type;
    } else if (msg.video) {
      content = '[Video]';
    } else if (msg.audio) {
      content = '[Audio]';
    } else if (msg.document) {
      content = `[Document: ${msg.document.filename || 'file'}]`;
    } else if (msg.location) {
      content = '[Location]';
    }

    const organization = await this.prisma.organization.findFirst({
      where: {
        settings: {
          path: ['whatsapp', 'phoneNumberId'],
          equals: phoneNumberId,
        },
      },
    }).catch(() => null);

    if (!organization) {
      this.logger.warn('No organization found for WhatsApp message');
      return;
    }

    const existingConversation = await this.prisma.chatConversation.findFirst({
      where: {
        organizationId: organization.id,
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
          visitorPhone: from,
          status: 'ACTIVE',
        },
      });
    }

    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        content,
        isBot: false,
      },
    });
  }

  async verifyWebhookMode(mode: string, token: string): Promise<boolean> {
    const verifyToken = this.configService.get('WEBHOOK_VERIFY_TOKEN');
    return mode === 'subscribe' && token === verifyToken;
  }

  async getTemplates(organizationId: string): Promise<any[]> {
    const accessToken = this.configService.get('META_ACCESS_TOKEN');
    const businessId = this.configService.get('WHATSAPP_BUSINESS_ID');

    if (!accessToken || !businessId) {
      return [];
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${businessId}/message_templates`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      this.logger.error(`Failed to get templates: ${error.message}`);
      return [];
    }
  }
}
