import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface Interaction {
  id: string;
  type: string;
  summary: string;
  sentiment?: number;
  occurredAt: Date;
  ticketId?: string;
  ticketSubject?: string;
  ticketStatus?: string;
}

interface Customer360Data {
  profile: any;
  stats: {
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    avgResolutionTime?: number;
    totalSpent?: number;
  };
  tickets: any[];
  interactions: Interaction[];
  healthScore: {
    score: number;
    status: string;
    trend: 'up' | 'down' | 'stable';
  };
  recentNotes: any[];
}

@Injectable()
export class Customer360Service {
  private readonly logger = new Logger(Customer360Service.name);

  constructor(private prisma: PrismaService) {}

  async getCustomer360(customerId: string, organizationId: string): Promise<Customer360Data> {
    const customer = await this.prisma.customerProfile.findFirst({
      where: { id: customerId, organizationId },
    });

    if (!customer) {
      const portalUser = await this.prisma.customerPortalUser.findFirst({
        where: { id: customerId, organizationId },
        include: { tickets: { include: { messages: true } } },
      });

      if (!portalUser) {
        throw new NotFoundException('Customer not found');
      }

      return this.buildFromPortalUser(portalUser, organizationId);
    }

    return this.buildFromProfile(customer, organizationId);
  }

  async getCustomerByEmail(email: string, organizationId: string): Promise<Customer360Data | null> {
    const customer = await this.prisma.customerProfile.findFirst({
      where: { email, organizationId },
    });

    if (!customer) {
      const portalUser = await this.prisma.customerPortalUser.findFirst({
        where: { email, organizationId },
      });

      if (!portalUser) return null;
      return this.buildFromPortalUser(portalUser, organizationId);
    }

    return this.buildFromProfile(customer, organizationId);
  }

  private async buildFromProfile(customer: any, organizationId: string): Promise<Customer360Data> {
    const [tickets, interactions, healthHistory, notes] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { customerProfileId: customer.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          channel: { select: { name: true, type: true } },
        },
      }),
      this.prisma.customerInteraction.findMany({
        where: { customerProfileId: customer.id },
        orderBy: { occurredAt: 'desc' },
        take: 50,
      }),
      this.prisma.customerHealthHistory.findMany({
        where: { customerProfileId: customer.id },
        orderBy: { recordedAt: 'desc' },
        take: 10,
      }),
      this.prisma.$queryRaw<any[]`
        SELECT * FROM "CustomerNote" 
        WHERE "customerProfileId" = ${customer.id}
        ORDER BY "createdAt" DESC
        LIMIT 10
      `.catch(() => []),
    ]);

    const openTickets = tickets.filter(t => !['CLOSED', 'RESOLVED'].includes(t.status));
    const resolvedTickets = tickets.filter(t => ['CLOSED', 'RESOLVED'].includes(t.status));

    const resolvedWithTime = resolvedTickets.filter(t => t.resolvedAt);
    const avgResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((sum, t) => {
          const diff = new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime();
          return sum + diff;
        }, 0) / resolvedWithTime.length / (1000 * 60 * 60)
      : null;

    const trend = this.calculateHealthTrend(healthHistory);

    return {
      profile: customer,
      stats: {
        totalTickets: tickets.length,
        openTickets: openTickets.length,
        resolvedTickets: resolvedTickets.length,
        avgResolutionTime: avgResolutionTime ? Math.round(avgResolutionTime) : undefined,
      },
      tickets: tickets.map(t => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        assignee: t.assignee,
        channel: t.channel,
      })),
      interactions: interactions.map(i => ({
        id: i.id,
        type: i.type,
        summary: i.summary,
        sentiment: i.sentiment,
        occurredAt: i.occurredAt,
        ticketId: i.ticketId,
      })),
      healthScore: {
        score: customer.healthScore || 50,
        status: customer.healthStatus || 'neutral',
        trend,
      },
      recentNotes: notes,
    };
  }

  private async buildFromPortalUser(portalUser: any, organizationId: string): Promise<Customer360Data> {
    const tickets = await this.prisma.ticket.findMany({
      where: { customerPortalUserId: portalUser.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        channel: { select: { name: true, type: true } },
      },
    });

    const openTickets = tickets.filter(t => !['CLOSED', 'RESOLVED'].includes(t.status));
    const resolvedTickets = tickets.filter(t => ['CLOSED', 'RESOLVED'].includes(t.status));

    return {
      profile: {
        id: portalUser.id,
        email: portalUser.email,
        name: portalUser.name,
        company: portalUser.company,
        createdAt: portalUser.createdAt,
      },
      stats: {
        totalTickets: tickets.length,
        openTickets: openTickets.length,
        resolvedTickets: resolvedTickets.length,
      },
      tickets: tickets.map(t => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        assignee: t.assignee,
        channel: t.channel,
      })),
      interactions: [],
      healthScore: {
        score: 50,
        status: 'neutral',
        trend: 'stable',
      },
      recentNotes: [],
    };
  }

  private calculateHealthTrend(history: any[]): 'up' | 'down' | 'stable' {
    if (history.length < 2) return 'stable';
    
    const recent = history[0]?.score || 50;
    const previous = history[1]?.score || 50;
    const diff = recent - previous;

    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  }

  async addNote(customerId: string, content: string, authorId: string): Promise<any> {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const { default: { CustomerNote } } = await import('@prisma/client');
    
    return this.prisma.$executeRaw`
      INSERT INTO "CustomerNote" (id, content, "customerProfileId", "authorId", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${content}, ${customerId}, ${authorId}, NOW(), NOW())
    `.then(() => this.prisma.customerProfile.findUnique({
      where: { id: customerId },
      select: { notes: true },
    })).catch(async () => {
      await this.prisma.customerProfile.update({
        where: { id: customerId },
        data: { notes: { push: content } },
      });
      return { success: true };
    });
  }

  async searchCustomers(organizationId: string, query: string): Promise<any[]> {
    const customers = await this.prisma.customerProfile.findMany({
      where: {
        organizationId,
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { company: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });

    return customers;
  }

  async getInteractionsTimeline(customerId: string, type?: string): Promise<Interaction[]> {
    const customer = await this.prisma.customerProfile.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      const portalUser = await this.prisma.customerPortalUser.findUnique({
        where: { id: customerId },
      });

      if (!portalUser) return [];
    }

    const where: any = customer 
      ? { customerProfileId: customerId }
      : { ticket: { customerPortalUserId: customerId } };

    const interactions = await this.prisma.customerInteraction.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      take: 100,
      include: {
        ticket: { select: { id: true, subject: true, status: true } },
      },
    });

    const ticketInteractions = await this.prisma.ticket.findMany({
      where: customer 
        ? { customerProfileId: customerId }
        : { customerPortalUserId: customerId },
      select: {
        id: true,
        subject: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const allInteractions: Interaction[] = [
      ...interactions.map(i => ({
        id: i.id,
        type: i.type,
        summary: i.summary || '',
        sentiment: i.sentiment || undefined,
        occurredAt: i.occurredAt,
        ticketId: i.ticketId || undefined,
        ticketSubject: i.ticket?.subject,
        ticketStatus: i.ticket?.status,
      })),
      ...ticketInteractions.map(t => ({
        id: `ticket-${t.id}`,
        type: 'ticket_created',
        summary: `Ticket created: ${t.subject}`,
        occurredAt: t.createdAt,
        ticketId: t.id,
        ticketSubject: t.subject,
        ticketStatus: t.status,
      })),
    ];

    return allInteractions.sort((a, b) => 
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    );
  }
}
