import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentStatus } from '@prisma/client';

@Injectable()
export class AgentAvailabilityService {
  constructor(private prisma: PrismaService) {}

  async updateStatus(
    agentId: string,
    organizationId: string,
    status: AgentStatus,
    statusMessage?: string
  ) {
    const existing = await this.prisma.agentAvailability.findUnique({
      where: { agentId },
    });

    if (existing) {
      await this.recordHistory(existing);

      return this.prisma.agentAvailability.update({
        where: { agentId },
        data: {
          status,
          statusMessage,
          lastSeenAt: new Date(),
        },
      });
    }

    return this.prisma.agentAvailability.create({
      data: {
        agentId,
        organizationId,
        status,
        statusMessage,
        lastSeenAt: new Date(),
      },
    });
  }

  private async recordHistory(availability: any) {
    const duration = Math.floor(
      (Date.now() - availability.lastSeenAt.getTime()) / 1000
    );

    await this.prisma.agentAvailabilityHistory.create({
      data: {
        agentId: availability.agentId,
        status: availability.status,
        duration,
        endedAt: new Date(),
      },
    });
  }

  async getAgentStatus(agentId: string) {
    return this.prisma.agentAvailability.findUnique({
      where: { agentId },
      include: {
        agent: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async getOrganizationAgents(organizationId: string) {
    const agents = await this.prisma.user.findMany({
      where: {
        organizationId,
        role: { in: ['AGENT', 'ADMIN', 'OWNER'] },
      },
      include: {
        availability: true,
      },
    });

    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      avatarUrl: agent.avatarUrl,
      status: agent.availability?.status || 'OFFLINE',
      statusMessage: agent.availability?.statusMessage,
      lastSeenAt: agent.availability?.lastSeenAt,
    }));
  }

  async getOnlineAgents(organizationId: string) {
    const availabilities = await this.prisma.agentAvailability.findMany({
      where: {
        organizationId,
        status: AgentStatus.ONLINE,
      },
      include: {
        agent: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return availabilities;
  }

  async heartbeat(agentId: string) {
    const availability = await this.prisma.agentAvailability.findUnique({
      where: { agentId },
    });

    if (availability) {
      await this.prisma.agentAvailability.update({
        where: { agentId },
        data: { lastSeenAt: new Date() },
      });
    }
  }

  async getAgentStats(agentId: string, days: number = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await this.prisma.agentAvailabilityHistory.findMany({
      where: {
        agentId,
        startedAt: { gte: since },
      },
    });

    const stats = {
      ONLINE: 0,
      AWAY: 0,
      BUSY: 0,
      OFFLINE: 0,
    };

    history.forEach((h) => {
      stats[h.status] = (stats[h.status] || 0) + h.duration;
    });

    return stats;
  }

  async cleanupStaleAgents(minutes: number = 5) {
    const threshold = new Date(Date.now() - minutes * 60 * 1000);

    const staleAgents = await this.prisma.agentAvailability.findMany({
      where: {
        lastSeenAt: { lt: threshold },
        status: { not: AgentStatus.OFFLINE },
      },
    });

    for (const agent of staleAgents) {
      await this.recordHistory(agent);
      await this.prisma.agentAvailability.update({
        where: { id: agent.id },
        data: { status: AgentStatus.OFFLINE },
      });
    }

    return { updated: staleAgents.length };
  }
}
