import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {}

  async sendMessage(organizationId: string, data: {
    channelId?: string;
    text: string;
    blocks?: any[];
    attachments?: any[];
  }) {
    const channel = await this.prisma.channel.findFirst({
      where: {
        organizationId,
        type: 'SLACK',
        active: true,
        ...(data.channelId ? { id: data.channelId } : {}),
      },
    });

    if (!channel) {
      throw new Error('Slack channel not configured');
    }

    const config = channel.config as any;
    const webhookUrl = config?.webhookUrl;

    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: data.text,
        blocks: data.blocks,
        attachments: data.attachments,
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`);
    }

    return { success: true };
  }

  async sendTicketNotification(organizationId: string, ticket: any, action: 'created' | 'updated' | 'assigned') {
    const actionText = {
      created: 'New Ticket Created',
      updated: 'Ticket Updated',
      assigned: 'Ticket Assigned',
    };

    const priorityColors: Record<string, string> = {
      LOW: '#6b7280',
      NORMAL: '#3b82f6',
      HIGH: '#f59e0b',
      URGENT: '#ef4444',
    };

    return this.sendMessage(organizationId, {
      text: `${actionText[action]}: ${ticket.subject}`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${actionText[action]}: ${ticket.subject}`,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Priority:*\n${ticket.priority}`,
            },
            {
              type: 'mrkdwn',
              text: `*Status:*\n${ticket.status.replace('_', ' ')}`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'View Ticket' },
              url: `${this.config.get('WEB_URL')}/dashboard/tickets/${ticket.id}`,
            },
          ],
        },
      ],
      attachments: [
        {
          color: priorityColors[ticket.priority] || '#3b82f6',
        },
      ],
    });
  }

  async handleSlashCommand(payload: any) {
    const { text, team_id, channel_id, user_id, response_url } = payload;

    // Parse command
    const args = text.split(' ');
    const command = args[0]?.toLowerCase();

    switch (command) {
      case 'create':
        // Create ticket from Slack
        const subject = args.slice(1).join(' ');
        return {
          response_type: 'ephemeral',
          text: `Creating ticket: "${subject}"...`,
        };

      case 'help':
      default:
        return {
          response_type: 'ephemeral',
          text: '*ZapTicket Commands:*\n• `/zapticket create <subject>` - Create a new ticket\n• `/zapticket help` - Show this help message',
        };
    }
  }
}
