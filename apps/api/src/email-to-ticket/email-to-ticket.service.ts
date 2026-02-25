import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from '../tickets/tickets.service';

interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: any[];
}

@Injectable()
export class EmailToTicketService {
  private readonly logger = new Logger(EmailToTicketService.name);

  constructor(
    private prisma: PrismaService,
    private tickets: TicketsService,
  ) {}

  async processIncomingEmail(email: EmailMessage, organizationId: string) {
    const fromEmail = this.extractEmail(email.from);
    const subject = email.subject || 'No Subject';
    const body = email.text || email.html || '';

    let customer = await this.prisma.customerProfile.findFirst({
      where: {
        organizationId,
        user: { email: fromEmail },
      },
      include: { user: true },
    });

    if (!customer) {
      const name = this.extractName(email.from) || fromEmail.split('@')[0];
      
      const user = await this.prisma.user.create({
        data: {
          email: fromEmail,
          name,
          organizationId,
          role: 'CUSTOMER',
        },
      });

      customer = await this.prisma.customerProfile.create({
        data: {
          userId: user.id,
          organizationId,
        },
        include: { user: true },
      });
    }

    const existingTicket = await this.prisma.ticket.findFirst({
      where: {
        subject: { contains: subject },
        creatorId: customer.userId,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingTicket) {
      await this.prisma.message.create({
        data: {
          content: body,
          ticketId: existingTicket.id,
          authorId: customer.userId,
          isInternal: false,
        },
      });

      await this.prisma.ticket.update({
        where: { id: existingTicket.id },
        data: { updatedAt: new Date() },
      });

      this.logger.log(`Reply added to ticket ${existingTicket.id}`);
      return { ticketId: existingTicket.id, type: 'reply' };
    }

    const ticket = await this.tickets.create(organizationId, customer.userId, {
      subject: this.cleanSubject(subject),
      description: body,
      priority: 'NORMAL',
    });

    if (email.attachments?.length > 0) {
      for (const attachment of email.attachments) {
        await this.prisma.attachment.create({
          data: {
            filename: attachment.filename,
            mimeType: attachment.contentType,
            size: attachment.size,
            url: attachment.path || '',
            ticketId: ticket.id,
          },
        });
      }
    }

    this.logger.log(`New ticket created from email: ${ticket.id}`);
    return { ticketId: ticket.id, type: 'new' };
  }

  private extractEmail(emailString: string): string {
    const match = emailString.match(/<(.+)>/);
    return match ? match[1] : emailString.trim();
  }

  private extractName(emailString: string): string | null {
    const match = emailString.match(/^"?([^"<]+)"?\s*</);
    return match ? match[1].trim() : null;
  }

  private cleanSubject(subject: string): string {
    return subject
      .replace(/^re:\s*/i, '')
      .replace(/^fwd:\s*/i, '')
      .replace(/^re\[(\d+)\]:\s*/i, '')
      .trim();
  }
}
