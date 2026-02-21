import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {}

  async sendMessage(organizationId: string, data: {
    channelId?: string;
    content?: string;
    embeds?: any[];
  }) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        organizationId,
        type: 'DISCORD',
        active: true,
        ...(data.channelId ? { id: data.channelId } : {}),
      },
    });

    if (!channel) {
      throw new Error('Discord channel not configured');
    }

    const config = channel.config as any;
    const webhookUrl = config?.webhookUrl;

    if (!webhookUrl) {
      throw new Error('Discord webhook URL not configured');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: data.content,
        embeds: data.embeds,
      }),
    });

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    return { success: true };
  }

  async sendTicketNotification(organizationId: string, ticket: any, action: 'created' | 'updated' | 'assigned') {
    const actionText = {
      created: '🎫 New Ticket Created',
      updated: '📝 Ticket Updated',
      assigned: '👤 Ticket Assigned',
    };

    const priorityColors: Record<string, number> = {
      LOW: 0x6b7280,
      NORMAL: 0x3b82f6,
      HIGH: 0xf59e0b,
      URGENT: 0xef4444,
    };

    return this.sendMessage(organizationId, {
      embeds: [
        {
          title: actionText[action],
          description: ticket.subject,
          color: priorityColors[ticket.priority] || 0x3b82f6,
          fields: [
            {
              name: 'Priority',
              value: ticket.priority,
              inline: true,
            },
            {
              name: 'Status',
              value: ticket.status.replace('_', ' '),
              inline: true,
            },
            {
              name: 'Created',
              value: new Date(ticket.createdAt).toLocaleString(),
              inline: true,
            },
          ],
          url: `${this.config.get('WEB_URL')}/dashboard/tickets/${ticket.id}`,
          timestamp: new Date().toISOString(),
        },
      ],
    });
  }

  async handleInteraction(payload: any) {
    const { type, data, member } = payload;

    // Discord interaction types
    const InteractionType = {
      PING: 1,
      APPLICATION_COMMAND: 2,
      MESSAGE_COMPONENT: 3,
    };

    if (type === InteractionType.PING) {
      return { type: 1 };
    }

    if (type === InteractionType.APPLICATION_COMMAND) {
      const { name, options } = data;

      switch (name) {
        case 'ticket':
          return this.handleTicketCommand(options, member);

        default:
          return {
            type: 4,
            data: {
              content: 'Unknown command',
              flags: 64, // Ephemeral
            },
          };
      }
    }

    return { type: 4, data: { content: 'Unknown interaction', flags: 64 } };
  }

  private handleTicketCommand(options: any[], member: any) {
    const subcommand = options?.[0]?.name;

    switch (subcommand) {
      case 'create':
        const subject = options?.[0]?.options?.find((o: any) => o.name === 'subject')?.value;
        return {
          type: 4,
          data: {
            content: `Creating ticket: "${subject}"...`,
            flags: 64,
          },
        };

      default:
        return {
          type: 4,
          data: {
            content: 'Unknown subcommand',
            flags: 64,
          },
        };
    }
  }
}
