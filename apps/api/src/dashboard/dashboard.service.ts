import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DashboardMetrics {
  tickets: {
    open: number;
    pending: number;
    resolved: number;
    closed: number;
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  responseTime: {
    avgFirstResponse: number;
    avgResolution: number;
    today: number;
  };
  agents: {
    online: number;
    away: number;
    busy: number;
    offline: number;
    total: number;
  };
  satisfaction: {
    avgScore: number;
    totalResponses: number;
    trend: 'up' | 'down' | 'stable';
  };
  channels: {
    email: number;
    chat: number;
    chatbot: number;
    form: number;
    other: number;
  };
  sla: {
    atRisk: number;
    breached: number;
    onTrack: number;
    complianceRate: number;
  };
  updatedAt: Date;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getMetrics(organizationId: string): Promise<DashboardMetrics> {
    const [
      ticketsByStatus,
      ticketsByPriority,
      agentStats,
      csatStats,
      channelStats,
      slaStats,
      todayCount,
      weekCount,
      monthCount,
      firstResponseTimes,
      resolutionTimes,
    ] = await Promise.all([
      this.getTicketsByStatus(organizationId),
      this.getTicketsByPriority(organizationId),
      this.getAgentStats(organizationId),
      this.getCSATStats(organizationId),
      this.getChannelStats(organizationId),
      this.getSLAStats(organizationId),
      this.getTicketCount(organizationId, 'today'),
      this.getTicketCount(organizationId, 'week'),
      this.getTicketCount(organizationId, 'month'),
      this.getFirstResponseTimes(organizationId),
      this.getResolutionTimes(organizationId),
    ]);

    const open = (ticketsByStatus.find(s => s.status === 'OPEN')?.count || 0);
    const pending = (ticketsByStatus.find(s => s.status === 'PENDING')?.count || 0);
    const resolved = (ticketsByStatus.find(s => s.status === 'RESOLVED')?.count || 0);
    const closed = (ticketsByStatus.find(s => s.status === 'CLOSED')?.count || 0);

    const avgFirstResponse = firstResponseTimes.length > 0
      ? firstResponseTimes.reduce((a, b) => a + b, 0) / firstResponseTimes.length
      : 0;

    const avgResolution = resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      : 0;

    return {
      tickets: {
        open,
        pending,
        resolved,
        closed,
        total: open + pending + resolved + closed,
        today: todayCount,
        thisWeek: weekCount,
        thisMonth: monthCount,
      },
      responseTime: {
        avgFirstResponse: Math.round(avgFirstResponse),
        avgResolution: Math.round(avgResolution),
        today: Math.round(avgFirstResponse),
      },
      agents: agentStats,
      satisfaction: csatStats,
      channels: channelStats,
      sla: slaStats,
      updatedAt: new Date(),
    };
  }

  private async getTicketsByStatus(organizationId: string) {
    return this.prisma.ticket.groupBy({
      by: ['status'],
      where: { organizationId },
      _count: { id: true },
    }).then(result => result.map(r => ({ status: r.status, count: r._count.id })));
  }

  private async getTicketsByPriority(organizationId: string) {
    return this.prisma.ticket.groupBy({
      by: ['priority'],
      where: { organizationId },
      _count: { id: true },
    }).then(result => result.map(r => ({ priority: r.priority, count: r._count.id })));
  }

  private async getAgentStats(organizationId: string) {
    const agents = await this.prisma.user.findMany({
      where: { 
        organizationId,
        role: { in: ['AGENT', 'ADMIN', 'OWNER'] },
      },
      select: { id: true },
    });

    const agentIds = agents.map(a => a.id);
    
    const availability = await this.prisma.agentAvailability.findMany({
      where: { userId: { in: agentIds } },
      orderBy: { updatedAt: 'desc' },
    });

    const latestByAgent = new Map();
    for (const a of availability) {
      if (!latestByAgent.has(a.userId)) {
        latestByAgent.set(a.userId, a);
      }
    }

    const statusCounts = { online: 0, away: 0, busy: 0, offline: 0 };
    for (const a of latestByAgent.values()) {
      switch (a.status) {
        case 'ONLINE': statusCounts.online++; break;
        case 'AWAY': statusCounts.away++; break;
        case 'BUSY': statusCounts.busy++; break;
        case 'OFFLINE': statusCounts.offline++; break;
      }
    }

    return {
      ...statusCounts,
      total: agents.length,
    };
  }

  private async getCSATStats(organizationId: string) {
    const surveys = await this.prisma.cSATResponse.findMany({
      where: { 
        survey: { ticket: { organizationId } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (surveys.length === 0) {
      return { avgScore: 0, totalResponses: 0, trend: 'stable' as const };
    }

    const avgScore = surveys.reduce((sum, s) => sum + s.score, 0) / surveys.length;
    
    const recent = surveys.slice(0, 50);
    const older = surveys.slice(50, 100);
    const recentAvg = recent.reduce((sum, s) => sum + s.score, 0) / (recent.length || 1);
    const olderAvg = older.reduce((sum, s) => sum + s.score, 0) / (older.length || 1);

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (recentAvg > olderAvg + 0.2) trend = 'up';
    else if (recentAvg < olderAvg - 0.2) trend = 'down';

    return {
      avgScore: Math.round(avgScore * 10) / 10,
      totalResponses: surveys.length,
      trend,
    };
  }

  private async getChannelStats(organizationId: string) {
    const tickets = await this.prisma.ticket.groupBy({
      by: ['channelId'],
      where: { organizationId },
      _count: { id: true },
    });

    const channels = await this.prisma.channel.findMany({
      where: { id: { in: tickets.map(t => t.channelId).filter(Boolean) } },
    });

    const channelMap = new Map(channels.map(c => [c.id, c.type]));

    const stats = { email: 0, chat: 0, chatbot: 0, form: 0, other: 0 };
    for (const t of tickets) {
      const type = t.channelId ? channelMap.get(t.channelId) : 'EMAIL';
      switch (type) {
        case 'EMAIL': stats.email += t._count.id; break;
        case 'CHAT': stats.chat += t._count.id; break;
        case 'CHATBOT': stats.chatbot += t._count.id; break;
        case 'FORM': stats.form += t._count.id; break;
        default: stats.other += t._count.id;
      }
    }

    return stats;
  }

  private async getSLAStats(organizationId: string) {
    const breaches = await this.prisma.sLABreach.findMany({
      where: { ticket: { organizationId } },
    });

    const atRisk = await this.prisma.ticket.count({
      where: { 
        organizationId,
        status: { notIn: ['CLOSED', 'RESOLVED'] },
        dueAt: { lte: new Date(Date.now() + 3600000) },
      },
    });

    const total = await this.prisma.ticket.count({
      where: { organizationId },
    });

    const breached = breaches.length;
    const onTrack = total - atRisk - breached;
    const complianceRate = total > 0 ? Math.round(((onTrack) / total) * 100) : 100;

    return {
      atRisk,
      breached,
      onTrack: Math.max(0, onTrack),
      complianceRate,
    };
  }

  private async getTicketCount(organizationId: string, period: 'today' | 'week' | 'month'): Promise<number> {
    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    return this.prisma.ticket.count({
      where: {
        organizationId,
        createdAt: { gte: startDate },
      },
    });
  }

  private async getFirstResponseTimes(organizationId: string): Promise<number[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { 
        organizationId,
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
      select: { createdAt: true, updatedAt: true },
      take: 100,
    });

    return tickets
      .filter(t => t.updatedAt && t.createdAt)
      .map(t => (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60));
  }

  private async getResolutionTimes(organizationId: string): Promise<number[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: { 
        organizationId,
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true },
      take: 100,
    });

    return tickets
      .filter(t => t.resolvedAt)
      .map(t => (t.resolvedAt!.getTime() - t.createdAt.getTime()) / (1000 * 60));
  }

  async getAgentLeaderboard(organizationId: string): Promise<any[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const agentStats = await this.prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: { 
        organizationId,
        assigneeId: { not: null },
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    const resolvedStats = await this.prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: { 
        organizationId,
        assigneeId: { not: null },
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { gte: thirtyDaysAgo },
      },
      _count: { id: true },
    });

    const resolvedMap = new Map(resolvedStats.map(r => [r.assigneeId, r._count.id]));

    const agents = await this.prisma.user.findMany({
      where: { id: { in: agentStats.map(a => a.assigneeId!) } },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });

    const agentMap = new Map(agents.map(a => [a.id, a]));

    return agentStats
      .map(stat => {
        const agent = agentMap.get(stat.assigneeId!);
        return {
          agent: agent || { id: stat.assigneeId, name: 'Unknown' },
          assigned: stat._count.id,
          resolved: resolvedMap.get(stat.assigneeId!) || 0,
        };
      })
      .sort((a, b) => b.resolved - a.resolved)
      .slice(0, 10);
  }

  async getTrends(organizationId: string, days: number = 30): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const tickets = await this.prisma.ticket.findMany({
      where: { 
        organizationId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        status: true,
      },
    });

    const dailyData = new Map<string, { created: number; resolved: number }>();

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = date.toISOString().split('T')[0];
      dailyData.set(key, { created: 0, resolved: 0 });
    }

    for (const ticket of tickets) {
      const key = ticket.createdAt.toISOString().split('T')[0];
      const day = dailyData.get(key);
      if (day) day.created++;
    }

    const resolvedTickets = tickets.filter(t => ['RESOLVED', 'CLOSED'].includes(t.status));
    for (const ticket of resolvedTickets) {
      const key = ticket.createdAt.toISOString().split('T')[0];
      const day = dailyData.get(key);
      if (day) day.resolved++;
    }

    return Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      created: data.created,
      resolved: data.resolved,
    }));
  }
}
