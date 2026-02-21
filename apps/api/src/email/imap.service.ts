import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Imap from 'imap-simple';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class ImapService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ImapService.name);
  private imapConnection: any = null;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async onModuleInit() {
    const host = this.config.get('IMAP_HOST');
    if (!host) {
      this.logger.log('IMAP not configured. Email receiving disabled.');
      return;
    }

    this.startPolling();
  }

  async onModuleDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    if (this.imapConnection) {
      await this.imapConnection.end();
    }
  }

  private getImapConfig() {
    return {
      imap: {
        user: this.config.get('IMAP_USER'),
        password: this.config.get('IMAP_PASS'),
        host: this.config.get('IMAP_HOST'),
        port: parseInt(this.config.get('IMAP_PORT') || '993'),
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        connTimeout: 10000,
        authTimeout: 5000,
      },
    };
  }

  private startPolling() {
    const intervalMs = parseInt(this.config.get('IMAP_POLL_INTERVAL') || '60000');
    this.pollInterval = setInterval(() => {
      this.checkEmails().catch((err) => this.logger.error(err));
    }, intervalMs);

    this.checkEmails().catch((err) => this.logger.error(err));
    this.logger.log(`IMAP polling started (every ${intervalMs / 1000}s)`);
  }

  async checkEmails(): Promise<void> {
    const config = this.getImapConfig();
    
    try {
      this.imapConnection = await Imap.connect(config);
      await this.imapConnection.openBox('INBOX');

      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        struct: true,
        markSeen: true,
      };

      const messages = await this.imapConnection.search(searchCriteria, fetchOptions);
      this.logger.log(`Found ${messages.length} new emails`);

      for (const message of messages) {
        await this.processEmail(message);
      }

      await this.imapConnection.end();
    } catch (error: any) {
      this.logger.error(`IMAP error: ${error.message}`);
    }
  }

  private async processEmail(message: any): Promise<void> {
    try {
      const header = message.parts.find((p: any) => p.which === 'HEADER');
      const body = message.parts.find((p: any) => p.which === 'TEXT');

      const subject = header?.body?.subject?.[0] || 'No Subject';
      const from = header?.body?.from?.[0] || '';
      const to = header?.body?.to?.[0] || '';
      const messageId = header?.body['message-id']?.[0];
      
      const fromEmail = this.extractEmail(from);
      const content = body?.body || '';

      const ticket = await this.prisma.ticket.findFirst({
        where: { 
          OR: [
            { description: { contains: messageId } },
            { messages: { some: { content: { contains: messageId } } } },
          ],
        },
        include: { organization: true },
      });

      if (ticket) {
        await this.prisma.message.create({
          data: {
            content: this.stripHtml(content),
            type: 'REPLY',
            ticketId: ticket.id,
            authorId: '',
          },
        });
        this.logger.log(`Added email reply to ticket ${ticket.id}`);
      } else {
        const newTicket = await this.prisma.ticket.create({
          data: {
            subject,
            description: this.stripHtml(content),
            status: 'OPEN',
            priority: 'NORMAL',
            organizationId: '',
            creatorId: '',
          },
        });
        this.logger.log(`Created ticket ${newTicket.id} from email`);
      }
    } catch (error: any) {
      this.logger.error(`Failed to process email: ${error.message}`);
    }
  }

  private extractEmail(from: string): string {
    const match = from.match(/<([^>]+)>/) || [null, from];
    return match[1]?.trim() || from;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
