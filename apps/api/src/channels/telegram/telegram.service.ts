import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getOrCreateChannel(organizationId: string): Promise<any> {
    let channel = await this.prisma.channel.findFirst({
      where: { organizationId, type: 'TELEGRAM' },
    });

    if (!channel) {
      channel = await this.prisma.channel.create({
        data: {
          organizationId,
          type: 'TELEGRAM',
          name: 'Telegram',
          config: {},
        },
      });
    }

    return channel;
  }

  async sendMessage(chatId: string, text: string, organizationId: string, parseMode: string = 'Markdown'): Promise<any> {
    const channel = await this.getOrCreateChannel(organizationId);
    
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      return {
        success: true,
        messageId: `mock_telegram_${Date.now()}`,
        status: 'queued',
        mock: true,
      };
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: parseMode,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new BadRequestException(`Telegram API error: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.result.message_id,
      };
    } catch (error) {
      this.logger.error(`Failed to send Telegram message: ${error.message}`);
      throw new BadRequestException(`Failed to send message: ${error.message}`);
    }
  }

  async sendInlineKeyboard(chatId: string, text: string, buttons: any[], organizationId: string): Promise<any> {
    const channel = await this.getOrCreateChannel(organizationId);
    
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      return {
        success: true,
        messageId: `mock_telegram_${Date.now()}`,
        mock: true,
      };
    }

    try {
      const keyboard = {
        inline_keyboard: buttons,
      };

      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            reply_markup: keyboard,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new BadRequestException(`Telegram API error: ${error}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.result.message_id,
      };
    } catch (error) {
      this.logger.error(`Failed to send inline keyboard: ${error.message}`);
      throw new BadRequestException(`Failed to send: ${error.message}`);
    }
  }

  async handleWebhook(payload: any): Promise<any> {
    const message = payload.message;
    const callbackQuery = payload.callback_query;

    if (message) {
      await this.processMessage(message);
    }

    if (callbackQuery) {
      await this.processCallback(callbackQuery);
    }

    return { ok: true };
  }

  private async processMessage(message: any): Promise<void> {
    const chatId = message.chat?.id;
    const text = message.text;
    const from = message.from;
    const messageId = message.message_id;

    if (!chatId || !text) return;

    const organization = await this.prisma.organization.findFirst({
      where: {
        settings: {
          path: ['telegram', 'botToken'],
          contains: 'dummy',
        },
      },
    }).catch(() => null);

    if (!organization) {
      return;
    }

    const conversation = await this.prisma.chatConversation.findFirst({
      where: {
        organizationId: organization.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    let conv;
    if (conversation) {
      conv = conversation;
    } else {
      conv = await this.prisma.chatConversation.create({
        data: {
          organizationId: organization.id,
          status: 'ACTIVE',
        },
      });
    }

    await this.prisma.chatMessage.create({
      data: {
        conversationId: conv.id,
        content: `Telegram from ${from?.first_name || 'User'}: ${text}`,
        isBot: false,
      },
    });
  }

  private async processCallback(callbackQuery: any): Promise<void> {
    const data = callbackQuery.data;
    const message = callbackQuery.message;

    this.logger.log(`Callback query: ${data}`);

    if (message?.chat?.id) {
      await this.sendMessage(
        message.chat.id,
        `Received callback: ${data}`,
        '',
      );
    }
  }

  async setWebhook(url: string): Promise<any> {
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      return { ok: false, error: 'Bot token not configured' };
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        }
      );

      return await response.json();
    } catch (error) {
      this.logger.error(`Failed to set webhook: ${error.message}`);
      return { ok: false, error: error.message };
    }
  }

  async getMe(): Promise<any> {
    const botToken = this.configService.get('TELEGRAM_BOT_TOKEN');

    if (!botToken) {
      return null;
    }

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`
      );

      return await response.json();
    } catch (error) {
      return null;
    }
  }
}
