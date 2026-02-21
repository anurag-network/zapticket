import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';
import { Priority, SLAPriority } from '@prisma/client';

interface SLAConfig {
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
}

@Injectable()
export class SLAService {
  private readonly logger = new Logger(SLAService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  async createPolicy(
    organizationId: string,
    name: string,
    priority: SLAPriority,
    responseTimeMinutes: number,
    resolutionTimeMinutes: number,
    description?: string,
    businessHoursOnly: boolean = false
  ) {
    return this.prisma.sLAPolicy.create({
      data: {
        organizationId,
        name,
        description,
        priority,
        responseTimeMinutes,
        resolutionTimeMinutes,
        businessHoursOnly,
      },
    });
  }

  async getPolicies(organizationId: string) {
    return this.prisma.sLAPolicy.findMany({
      where: { organizationId },
      orderBy: { priority: 'asc' },
    });
  }

  async updatePolicy(id: string, updates: Partial<{
    name: string;
    description: string;
    responseTimeMinutes: number;
    resolutionTimeMinutes: number;
    businessHoursOnly: boolean;
    active: boolean;
  }>) {
    return this.prisma.sLAPolicy.update({
      where: { id },
      data: updates,
    });
  }

  async deletePolicy(id: string) {
    await this.prisma.sLAPolicy.delete({ where: { id } });
  }

  private getSLAConfig(priority: Priority, policies: any[]): SLAConfig | null {
    const slaPriority = this.mapPriorityToSLA(priority);
    
    const policy = policies.find(
      (p) => p.priority === slaPriority && p.active
    );

    return policy
      ? {
          responseTimeMinutes: policy.responseTimeMinutes,
          resolutionTimeMinutes: policy.resolutionTimeMinutes,
        }
      : null;
  }

  private mapPriorityToSLA(priority: Priority): SLAPriority {
    const mapping: Record<Priority, SLAPriority> = {
      LOW: SLAPriority.LOW,
      NORMAL: SLAPriority.NORMAL,
      HIGH: SLAPriority.HIGH,
      URGENT: SLAPriority.URGENT,
    };
    return mapping[priority];
  }

  async checkTicketSLA(ticketId: string): Promise<{
    responseBreached: boolean;
    resolutionBreached: boolean;
    responseRemainingMinutes: number;
    resolutionRemainingMinutes: number;
  }> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          where: { type: 'REPLY' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const policies = await this.prisma.sLAPolicy.findMany({
      where: { organizationId: ticket.organizationId, active: true },
    });

    const slaConfig = this.getSLAConfig(ticket.priority as Priority, policies);

    if (!slaConfig) {
      return {
        responseBreached: false,
        resolutionBreached: false,
        responseRemainingMinutes: 0,
        resolutionRemainingMinutes: 0,
      };
    }

    const now = Date.now();
    const createdAt = ticket.createdAt.getTime();

    const firstResponseAt = ticket.messages[0]?.createdAt?.getTime();
    const responseTimeMs = slaConfig.responseTimeMinutes * 60 * 1000;
    const resolutionTimeMs = slaConfig.resolutionTimeMinutes * 60 * 1000;

    let responseBreached = false;
    let responseRemainingMinutes = 0;

    if (firstResponseAt) {
      const responseTime = firstResponseAt - createdAt;
      responseBreached = responseTime > responseTimeMs;
      responseRemainingMinutes = responseBreached
        ? 0
        : Math.max(0, (responseTimeMs - responseTime) / 60000);
    } else {
      const elapsed = now - createdAt;
      responseBreached = elapsed > responseTimeMs;
      responseRemainingMinutes = responseBreached
        ? 0
        : Math.max(0, (responseTimeMs - elapsed) / 60000);
    }

    let resolutionBreached = false;
    let resolutionRemainingMinutes = 0;

    if (ticket.resolvedAt) {
      const resolutionTime = ticket.resolvedAt.getTime() - createdAt;
      resolutionBreached = resolutionTime > resolutionTimeMs;
      resolutionRemainingMinutes = 0;
    } else if (['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      resolutionBreached = false;
      resolutionRemainingMinutes = 0;
    } else {
      const elapsed = now - createdAt;
      resolutionBreached = elapsed > resolutionTimeMs;
      resolutionRemainingMinutes = resolutionBreached
        ? 0
        : Math.max(0, (resolutionTimeMs - elapsed) / 60000);
    }

    return {
      responseBreached,
      resolutionBreached,
      responseRemainingMinutes: Math.round(responseRemainingMinutes),
      resolutionRemainingMinutes: Math.round(resolutionRemainingMinutes),
    };
  }

  async recordBreach(
    ticketId: string,
    policyId: string,
    breachType: 'response' | 'resolution'
  ) {
    return this.prisma.sLABreach.create({
      data: {
        ticketId,
        policyId,
        breachType,
      },
    });
  }

  async acknowledgeBreach(breachId: string, acknowledgedBy: string) {
    return this.prisma.sLABreach.update({
      where: { id: breachId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedBy,
      },
    });
  }

  async getBreaches(organizationId: string, days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.prisma.sLABreach.findMany({
      where: {
        policy: { organizationId },
        breachedAt: { gte: since },
      },
      include: {
        ticket: { select: { id: true, subject: true, priority: true } },
        policy: { select: { name: true } },
      },
      orderBy: { breachedAt: 'desc' },
    });
  }

  async getSLAStats(organizationId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const breaches = await this.prisma.sLABreach.count({
      where: {
        policy: { organizationId },
        breachedAt: { gte: since },
      },
    });

    const tickets = await this.prisma.ticket.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
      },
      select: {
        id: true,
        createdAt: true,
        resolvedAt: true,
        messages: {
          where: { type: 'REPLY' },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    });

    const policies = await this.prisma.sLAPolicy.findMany({
      where: { organizationId, active: true },
    });

    let responseBreaches = 0;
    let resolutionBreaches = 0;

    for (const ticket of tickets) {
      const slaConfig = this.getSLAConfig(
        await this.getTicketPriority(ticket.id),
        policies
      );

      if (!slaConfig) continue;

      const responseTimeMs = slaConfig.responseTimeMinutes * 60 * 1000;
      const firstResponseAt = ticket.messages[0]?.createdAt?.getTime();
      const createdAt = ticket.createdAt.getTime();

      if (firstResponseAt) {
        if (firstResponseAt - createdAt > responseTimeMs) {
          responseBreaches++;
        }
      }

      if (ticket.resolvedAt) {
        const resolutionTimeMs = slaConfig.resolutionTimeMinutes * 60 * 1000;
        if (ticket.resolvedAt.getTime() - createdAt > resolutionTimeMs) {
          resolutionBreaches++;
        }
      }
    }

    return {
      totalTickets: tickets.length,
      totalBreaches: breaches,
      responseBreaches,
      resolutionBreaches,
      complianceRate:
        tickets.length > 0
          ? ((tickets.length - responseBreaches - resolutionBreaches) / tickets.length) * 100
          : 100,
    };
  }

  private async getTicketPriority(ticketId: string): Promise<Priority> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { priority: true },
    });
    return (ticket?.priority as Priority) || Priority.NORMAL;
  }
}
