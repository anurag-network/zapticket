import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DataExportService {
  constructor(private prisma: PrismaService) {}

  async exportTickets(organizationId: string, format: 'json' | 'csv' = 'json', filters?: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { organizationId };
    
    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const tickets = await this.prisma.ticket.findMany({
      where,
      include: {
        assignee: { select: { name: true, email: true } },
        creator: { select: { name: true, email: true } },
        tags: { include: { tag: true } },
        messages: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const headers = [
        'id', 'subject', 'description', 'status', 'priority',
        'createdAt', 'updatedAt', 'resolvedAt', 'assignee', 'creator',
        'tagCount', 'messageCount'
      ];
      
      const rows = tickets.map(t => [
        t.id,
        `"${t.subject.replace(/"/g, '""')}"`,
        `"${t.description.replace(/"/g, '""').substring(0, 500)}"`,
        t.status,
        t.priority,
        t.createdAt.toISOString(),
        t.updatedAt.toISOString(),
        t.resolvedAt?.toISOString() || '',
        t.assignee?.name || '',
        t.creator?.name || '',
        t.tags.length,
        t.messages.length,
      ]);
      
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    return tickets;
  }

  async exportCustomers(organizationId: string, format: 'json' | 'csv' = 'json') {
    const customers = await this.prisma.customerProfile.findMany({
      where: { organizationId },
      include: {
        user: { select: { name: true, email: true } },
        tickets: { select: { id: true, status: true } },
      },
    });

    if (format === 'csv') {
      const headers = ['id', 'name', 'email', 'company', 'ticketCount', 'createdAt'];
      const rows = customers.map(c => [
        c.id,
        `"${(c.user?.name || '').replace(/"/g, '""')}"`,
        c.user?.email || '',
        c.company || '',
        c.tickets.length,
        c.createdAt.toISOString(),
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    return customers;
  }

  async exportAgents(organizationId: string, format: 'json' | 'csv' = 'json') {
    const agents = await this.prisma.user.findMany({
      where: { organizationId, role: { in: ['AGENT', 'ADMIN', 'OWNER'] } },
      include: {
        assignedTickets: { select: { id: true, status: true, resolvedAt: true } },
      },
    });

    const data = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      ticketCount: agent.assignedTickets.length,
      resolvedCount: agent.assignedTickets.filter(t => 
        t.status === 'RESOLVED' || t.status === 'CLOSED'
      ).length,
      createdAt: agent.createdAt,
    }));

    if (format === 'csv') {
      const headers = ['id', 'name', 'email', 'role', 'ticketCount', 'resolvedCount', 'createdAt'];
      const rows = data.map(d => [
        d.id,
        `"${(d.name || '').replace(/"/g, '""')}"`,
        d.email,
        d.role,
        d.ticketCount,
        d.resolvedCount,
        d.createdAt.toISOString(),
      ]);
      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    return data;
  }
}
