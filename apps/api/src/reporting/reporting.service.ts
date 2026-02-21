import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  async getTicketStats(organizationId: string, dateRange?: { start: Date; end: Date }) {
    const where: any = { organizationId };
    
    if (dateRange) {
      where.createdAt = {
        gte: dateRange.start,
        lte: dateRange.end,
      };
    }

    const [
      total,
      byStatus,
      byPriority,
      avgResolutionTime,
      avgFirstResponseTime,
    ] = await Promise.all([
      this.prisma.ticket.count({ where }),
      
      this.prisma.ticket.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      
      this.prisma.ticket.groupBy({
        by: ['priority'],
        where,
        _count: true,
      }),
      
      this.prisma.ticket.aggregate({
        where: { ...where, resolvedAt: { not: null } },
        _avg: {
          createdAt: true,
        },
      }),
      
      this.getAvgFirstResponseTime(organizationId, dateRange),
    ]);

    const resolutionTimeMs = await this.calculateAvgResolutionTime(organizationId, dateRange);

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
      avgResolutionTimeHours: resolutionTimeMs ? resolutionTimeMs / (1000 * 60 * 60) : null,
      avgFirstResponseTimeHours: avgFirstResponseTime ? avgFirstResponseTime / (1000 * 60 * 60) : null,
    };
  }

  private async calculateAvgResolutionTime(organizationId: string, dateRange?: { start: Date; end: Date }) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        organizationId,
        resolvedAt: { not: null },
        ...(dateRange ? { createdAt: { gte: dateRange.start, lte: dateRange.end } } : {}),
      },
      select: { createdAt: true, resolvedAt: true },
    });

    if (tickets.length === 0) return null;

    const totalMs = tickets.reduce((sum, ticket) => {
      if (!ticket.resolvedAt) return sum;
      return sum + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime());
    }, 0);

    return totalMs / tickets.length;
  }

  private async getAvgFirstResponseTime(organizationId: string, dateRange?: { start: Date; end: Date }) {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        organizationId,
        ...(dateRange ? { createdAt: { gte: dateRange.start, lte: dateRange.end } } : {}),
      },
      select: {
        createdAt: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        },
      },
    });

    if (tickets.length === 0) return null;

    const responseTimes = tickets
      .filter((t) => t.messages.length > 0)
      .map((t) => t.messages[0].createdAt.getTime() - t.createdAt.getTime());

    if (responseTimes.length === 0) return null;

    return responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  }

  async getTicketsOverTime(organizationId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
      select: { createdAt: true, status: true },
    });

    const data: { date: string; created: number; resolved: number }[] = [];
    const dateMap = new Map<string, { created: number; resolved: number }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const key = date.toISOString().split('T')[0];
      dateMap.set(key, { created: 0, resolved: 0 });
    }

    tickets.forEach((ticket) => {
      const key = ticket.createdAt.toISOString().split('T')[0];
      const entry = dateMap.get(key);
      if (entry) {
        entry.created++;
        if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
          entry.resolved++;
        }
      }
    });

    dateMap.forEach((value, key) => {
      data.push({ date: key, ...value });
    });

    return data;
  }

  async getAgentPerformance(organizationId: string, dateRange?: { start: Date; end: Date }) {
    const agents = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ['AGENT', 'ADMIN', 'OWNER'] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        assignedTickets: {
          where: dateRange ? { createdAt: { gte: dateRange.start, lte: dateRange.end } } : {},
          select: {
            status: true,
            resolvedAt: true,
            createdAt: true,
          },
        },
        messages: {
          where: dateRange ? { createdAt: { gte: dateRange.start, lte: dateRange.end } } : {},
          select: { id: true },
        },
      },
    });

    return agents.map((agent) => {
      const resolved = agent.assignedTickets.filter(
        (t) => t.status === 'RESOLVED' || t.status === 'CLOSED'
      ).length;
      
      const total = agent.assignedTickets.length;
      
      return {
        id: agent.id,
        name: agent.name || agent.email,
        ticketsAssigned: total,
        ticketsResolved: resolved,
        resolutionRate: total > 0 ? (resolved / total) * 100 : 0,
        messagesSent: agent.messages.length,
      };
    });
  }

  async getCategoryBreakdown(organizationId: string) {
    const articles = await this.prisma.article.findMany({
      where: { organizationId },
      select: {
        views: true,
        categoryId: true,
        category: { select: { name: true } },
      },
    });

    const breakdown = articles.reduce((acc, article) => {
      const key = article.categoryId;
      if (!acc[key]) {
        acc[key] = {
          categoryId: key,
          categoryName: article.category?.name || 'Unknown',
          articleCount: 0,
          totalViews: 0,
        };
      }
      acc[key].articleCount++;
      acc[key].totalViews += article.views;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(breakdown).sort((a: any, b: any) => b.totalViews - a.totalViews);
  }

  async getDashboardMetrics(organizationId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const [
      totalTickets,
      openTickets,
      todayTickets,
      weekTickets,
      monthTickets,
      totalUsers,
      totalArticles,
      slaBreaches,
    ] = await Promise.all([
      this.prisma.ticket.count({ where: { organizationId } }),
      this.prisma.ticket.count({
        where: { organizationId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.ticket.count({
        where: { organizationId, createdAt: { gte: todayStart } },
      }),
      this.prisma.ticket.count({
        where: { organizationId, createdAt: { gte: weekStart } },
      }),
      this.prisma.ticket.count({
        where: { organizationId, createdAt: { gte: monthStart } },
      }),
      this.prisma.user.count({ where: { organizationId } }),
      this.prisma.article.count({ where: { organizationId, published: true } }),
      this.prisma.ticket.count({
        where: {
          organizationId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      tickets: {
        total: totalTickets,
        open: openTickets,
        createdToday: todayTickets,
        createdThisWeek: weekTickets,
        createdThisMonth: monthTickets,
        slaBreaches,
      },
      users: {
        total: totalUsers,
      },
      knowledgeBase: {
        articles: totalArticles,
      },
    };
  }
}
