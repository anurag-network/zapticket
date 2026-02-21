import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface HealthScoreFactors {
  ticketVolume: number;
  resolutionTime: number;
  sentimentScore: number;
  satisfactionScore: number;
  responseTime: number;
}

@Injectable()
export class CustomerHealthService {
  private readonly logger = new Logger(CustomerHealthService.name);

  constructor(private prisma: PrismaService) {}

  async getOrCreateProfile(email: string, organizationId: string, name?: string) {
    let profile = await this.prisma.customerProfile.findUnique({
      where: { email },
    });

    if (!profile) {
      profile = await this.prisma.customerProfile.create({
        data: {
          email,
          name,
          organizationId,
          healthScore: 50,
          healthStatus: 'neutral',
        },
      });
    }

    return profile;
  }

  async calculateHealthScore(profileId: string): Promise<number> {
    const profile = await this.prisma.customerProfile.findUnique({
      where: { id: profileId },
      include: {
        tickets: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
          include: {
            sentimentScores: { orderBy: { analyzedAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!profile) {
      throw new Error('Customer profile not found');
    }

    const factors = await this.calculateFactors(profile);

    const weights = {
      ticketVolume: 0.15,
      resolutionTime: 0.25,
      sentimentScore: 0.30,
      satisfactionScore: 0.20,
      responseTime: 0.10,
    };

    const healthScore =
      factors.ticketVolume * weights.ticketVolume +
      factors.resolutionTime * weights.resolutionTime +
      factors.sentimentScore * weights.sentimentScore +
      factors.satisfactionScore * weights.satisfactionScore +
      factors.responseTime * weights.responseTime;

    const normalizedScore = Math.max(0, Math.min(100, healthScore));

    await this.updateHealthScore(profileId, normalizedScore);

    return normalizedScore;
  }

  private async calculateFactors(profile: any): Promise<HealthScoreFactors> {
    const tickets = profile.tickets;
    const totalTickets = tickets.length;

    const ticketVolumeScore = this.calculateTicketVolumeScore(totalTickets);

    const resolutionTimeScore = this.calculateResolutionTimeScore(tickets);

    const sentimentScore = this.calculateSentimentScore(tickets);

    const satisfactionScore = profile.avgSatisfaction
      ? profile.avgSatisfaction * 20
      : 50;

    const responseTimeScore = 50;

    return {
      ticketVolume: ticketVolumeScore,
      resolutionTime: resolutionTimeScore,
      sentimentScore: sentimentScore,
      satisfactionScore: satisfactionScore,
      responseTime: responseTimeScore,
    };
  }

  private calculateTicketVolumeScore(count: number): number {
    if (count === 0) return 100;
    if (count <= 3) return 90;
    if (count <= 7) return 70;
    if (count <= 15) return 50;
    if (count <= 30) return 30;
    return 10;
  }

  private calculateResolutionTimeScore(tickets: any[]): number {
    const resolvedTickets = tickets.filter(
      (t) => t.resolvedAt && t.createdAt
    );

    if (resolvedTickets.length === 0) return 50;

    const avgHours = resolvedTickets.reduce((sum, t) => {
      const hours =
        (new Date(t.resolvedAt).getTime() - new Date(t.createdAt).getTime()) /
        (1000 * 60 * 60);
      return sum + hours;
    }, 0) / resolvedTickets.length;

    if (avgHours <= 4) return 100;
    if (avgHours <= 24) return 80;
    if (avgHours <= 72) return 60;
    if (avgHours <= 168) return 40;
    return 20;
  }

  private calculateSentimentScore(tickets: any[]): number {
    const sentiments = tickets
      .filter((t) => t.sentimentScores.length > 0)
      .map((t) => t.sentimentScores[0].score);

    if (sentiments.length === 0) return 50;

    const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
    return ((avgSentiment + 1) / 2) * 100;
  }

  private async updateHealthScore(profileId: string, score: number): Promise<void> {
    const status = this.getHealthStatus(score);

    await this.prisma.customerProfile.update({
      where: { id: profileId },
      data: {
        healthScore: score,
        healthStatus: status,
      },
    });

    await this.prisma.customerHealthHistory.create({
      data: {
        customerProfileId: profileId,
        score,
        status,
        reason: 'Scheduled health score calculation',
      },
    });
  }

  private getHealthStatus(score: number): string {
    if (score >= 80) return 'healthy';
    if (score >= 60) return 'good';
    if (score >= 40) return 'neutral';
    if (score >= 20) return 'at_risk';
    return 'critical';
  }

  async getHealthHistory(profileId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return this.prisma.customerHealthHistory.findMany({
      where: {
        customerProfileId: profileId,
        recordedAt: { gte: since },
      },
      orderBy: { recordedAt: 'asc' },
    });
  }

  async getOrganizationHealthStats(organizationId: string) {
    const profiles = await this.prisma.customerProfile.findMany({
      where: { organizationId },
    });

    const distribution = {
      healthy: 0,
      good: 0,
      neutral: 0,
      at_risk: 0,
      critical: 0,
    };

    let totalScore = 0;

    profiles.forEach((p) => {
      distribution[p.healthStatus as keyof typeof distribution]++;
      totalScore += p.healthScore;
    });

    return {
      totalCustomers: profiles.length,
      averageScore: profiles.length > 0 ? totalScore / profiles.length : 0,
      distribution,
      atRiskCount: distribution.at_risk + distribution.critical,
    };
  }

  async recordInteraction(
    profileId: string,
    type: string,
    summary: string,
    ticketId?: string,
    sentiment?: number
  ) {
    await this.prisma.customerInteraction.create({
      data: {
        customerProfileId: profileId,
        type,
        summary,
        ticketId,
        sentiment,
      },
    });

    await this.prisma.customerProfile.update({
      where: { id: profileId },
      data: { lastContactAt: new Date() },
    });
  }

  async getInteractions(profileId: string, limit: number = 20) {
    return this.prisma.customerInteraction.findMany({
      where: { customerProfileId: profileId },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
  }

  async getAtRiskCustomers(organizationId: string) {
    return this.prisma.customerProfile.findMany({
      where: {
        organizationId,
        healthStatus: { in: ['at_risk', 'critical'] },
      },
      orderBy: { healthScore: 'asc' },
      take: 20,
    });
  }
}
