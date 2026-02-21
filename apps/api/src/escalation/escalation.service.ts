import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../integrations/webhooks.service';

@Injectable()
export class EscalationService {
  private readonly logger = new Logger(EscalationService.name);

  constructor(
    private prisma: PrismaService,
    private webhooks: WebhooksService
  ) {}

  async escalateTicket(
    ticketId: string,
    reason: string,
    userId?: string,
    autoEscalated: boolean = false
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { organization: true },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.status === 'ESCALATED') {
      return ticket;
    }

    const [updatedTicket] = await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'ESCALATED',
          escalatedAt: new Date(),
          escalatedReason: reason,
          priority: ticket.priority === 'LOW' || ticket.priority === 'NORMAL' ? 'HIGH' : ticket.priority,
        },
      }),
      this.prisma.escalationLog.create({
        data: {
          ticketId,
          reason,
          autoEscalated,
          escalatedById: userId,
        },
      }),
    ]);

    await this.webhooks.trigger('ticket.escalated', ticket.organizationId, {
      ticketId,
      subject: ticket.subject,
      reason,
      autoEscalated,
      organizationId: ticket.organizationId,
    });

    this.logger.log(`Ticket ${ticketId} escalated: ${reason}`);

    return updatedTicket;
  }

  async resolveEscalation(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || ticket.status !== 'ESCALATED') {
      throw new Error('Ticket is not escalated');
    }

    const escalationLog = await this.prisma.escalationLog.findFirst({
      where: { ticketId, resolvedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (escalationLog) {
      await this.prisma.escalationLog.update({
        where: { id: escalationLog.id },
        data: {
          resolvedAt: new Date(),
          resolvedById: userId,
        },
      });
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: 'IN_PROGRESS',
      },
    });
  }

  async getEscalatedTickets(organizationId: string) {
    return this.prisma.ticket.findMany({
      where: {
        organizationId,
        status: 'ESCALATED',
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        escalationLogs: {
          where: { resolvedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { escalatedAt: 'desc' },
    });
  }

  async getEscalationStats(organizationId: string) {
    const [total, autoEscalated, manualEscalated, avgResolutionTime] = await Promise.all([
      this.prisma.escalationLog.count({
        where: {
          ticket: { organizationId },
        },
      }),
      this.prisma.escalationLog.count({
        where: {
          ticket: { organizationId },
          autoEscalated: true,
        },
      }),
      this.prisma.escalationLog.count({
        where: {
          ticket: { organizationId },
          autoEscalated: false,
        },
      }),
      this.getAverageEscalationResolutionTime(organizationId),
    ]);

    return {
      total,
      autoEscalated,
      manualEscalated,
      avgResolutionTimeHours: avgResolutionTime,
    };
  }

  private async getAverageEscalationResolutionTime(organizationId: string) {
    const logs = await this.prisma.escalationLog.findMany({
      where: {
        ticket: { organizationId },
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true },
    });

    if (logs.length === 0) return null;

    const totalTime = logs.reduce((sum, log) => {
      if (!log.resolvedAt) return sum;
      return sum + (log.resolvedAt.getTime() - log.createdAt.getTime());
    }, 0);

    return totalTime / logs.length / (1000 * 60 * 60);
  }

  async autoEscalateSlaBreaches() {
    const slaThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const breachedTickets = await this.prisma.ticket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        createdAt: { lt: slaThreshold },
        escalatedAt: null,
      },
    });

    let escalated = 0;
    for (const ticket of breachedTickets) {
      try {
        await this.escalateTicket(
          ticket.id,
          'SLA breach: Ticket open for more than 24 hours without resolution',
          undefined,
          true
        );
        escalated++;
      } catch (error) {
        this.logger.error(`Failed to escalate ticket ${ticket.id}: ${error}`);
      }
    }

    return { checked: breachedTickets.length, escalated };
  }
}
