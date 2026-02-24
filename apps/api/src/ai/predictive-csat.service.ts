import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface CSATPrediction {
  predictedScore: number;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}

@Injectable()
export class PredictiveCSATService {
  private readonly logger = new Logger(PredictiveCSATService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async predictCSAT(ticketId: string): Promise<CSATPrediction> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        customerProfile: true,
        assignee: true,
        sentimentScores: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const factors: string[] = [];
    let score = 50;

    const negativeSentiment = ticket.sentimentScores.filter(s => 
      s.type === 'VERY_NEGATIVE' || s.type === 'NEGATIVE'
    ).length;
    
    if (negativeSentiment > 0) {
      score -= negativeSentiment * 10;
      factors.push('Negative sentiment detected in conversation');
    }

    const positiveSentiment = ticket.sentimentScores.filter(s => 
      s.type === 'VERY_POSITIVE' || s.type === 'POSITIVE'
    ).length;
    
    if (positiveSentiment > 0) {
      score += positiveSentiment * 5;
      factors.push('Positive sentiment detected');
    }

    const waitTime = Date.now() - new Date(ticket.createdAt).getTime();
    const hoursWaiting = waitTime / (1000 * 60 * 60);
    
    if (hoursWaiting > 24) {
      score -= 10;
      factors.push('Customer waiting > 24 hours');
    } else if (hoursWaiting > 48) {
      score -= 20;
      factors.push('Customer waiting > 48 hours');
    }

    if (ticket.priority === 'URGENT') {
      score += 5;
      factors.push('High priority ticket');
    }

    const messageCount = ticket.messages.length;
    if (messageCount > 10) {
      score -= 5;
      factors.push('Long conversation thread');
    }

    if (ticket.customerProfile) {
      const avgSatisfaction = ticket.customerProfile.avgSatisfaction;
      if (avgSatisfaction) {
        score = (score + avgSatisfaction) / 2;
        factors.push('Based on customer history');
      }

      const openTickets = ticket.customerProfile.openTickets;
      if (openTickets > 5) {
        score -= 10;
        factors.push('Customer has multiple open tickets');
      }
    }

    if (!ticket.assignee) {
      score -= 15;
      factors.push('Ticket not assigned');
      factors.push('Assign to improve satisfaction');
    }

    const hasInternalNotes = ticket.messages.some(m => m.type === 'NOTE');
    if (hasInternalNotes) {
      score += 5;
      factors.push('Internal collaboration detected');
    }

    const scoreClamped = Math.max(0, Math.min(100, score));
    
    let riskLevel: 'low' | 'medium' | 'high';
    if (scoreClamped >= 70) {
      riskLevel = 'low';
    } else if (scoreClamped >= 40) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    const recommendations: string[] = [];
    if (riskLevel === 'high') {
      recommendations.push('Consider prioritizing this ticket');
      recommendations.push('Escalate to senior agent if not assigned');
    }
    if (hoursWaiting > 24) {
      recommendations.push('Send update to customer');
    }
    if (!ticket.assignee) {
      recommendations.push('Assign to available agent');
    }
    if (negativeSentiment > 0) {
      recommendations.push('Address customer concerns empathetically');
    }

    const confidence = this.calculateConfidence(ticket);

    return {
      predictedScore: Math.round(scoreClamped),
      confidence,
      riskLevel,
      factors,
      recommendations,
    };
  }

  async checkAtRiskTickets(organizationId: string): Promise<any[]> {
    const atRiskTickets = await this.prisma.ticket.findMany({
      where: {
        organizationId,
        status: { notIn: ['CLOSED', 'RESOLVED'] },
      },
      include: {
        assignee: true,
        customerProfile: true,
        sentimentScores: true,
      },
    });

    const predictions = await Promise.all(
      atRiskTickets.map(async (ticket) => {
        const prediction = await this.predictCSAT(ticket.id);
        return {
          ticket,
          ...prediction,
        };
      })
    );

    return predictions
      .filter(p => p.riskLevel === 'high')
      .sort((a, b) => a.predictedScore - b.predictedScore);
  }

  async recordActualCSAT(ticketId: string, score: number): Promise<void> {
    await this.prisma.cSATResponse.create({
      data: {
        score,
        survey: {
          create: {
            ticketId,
          },
        },
      },
    });

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { customerProfile: true },
    });

    if (ticket?.customerProfileId) {
      const history = await this.prisma.cSATResponse.findMany({
        where: {
          survey: {
            ticket: { customerProfileId: ticket.customerProfileId },
          },
        },
      });

      const avgScore = history.reduce((sum, r) => sum + r.score, 0) / history.length;

      await this.prisma.customerProfile.update({
        where: { id: ticket.customerProfileId },
        data: { avgSatisfaction: avgScore },
      });
    }
  }

  private calculateConfidence(ticket: any): number {
    let confidence = 0.5;

    const messageCount = ticket.messages.length;
    if (messageCount > 5) confidence += 0.1;
    if (messageCount > 10) confidence += 0.1;

    const sentimentCount = ticket.sentimentScores.length;
    if (sentimentCount > 0) confidence += 0.2;

    const hasHistory = ticket.customerProfile?.avgSatisfaction !== null;
    if (hasHistory) confidence += 0.1;

    return Math.min(0.95, confidence);
  }

  async getSatisfactionTrends(organizationId: string, days: number = 30): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const responses = await this.prisma.cSATResponse.findMany({
      where: {
        createdAt: { gte: startDate },
        survey: {
          ticket: { organizationId },
        },
      },
      include: {
        survey: {
          include: {
            ticket: {
              select: { assigneeId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyScores: Record<string, number[]> = {};
    
    for (const response of responses) {
      const date = response.createdAt.toISOString().split('T')[0];
      if (!dailyScores[date]) {
        dailyScores[date] = [];
      }
      dailyScores[date].push(response.score);
    }

    const trends = Object.entries(dailyScores).map(([date, scores]) => ({
      date,
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
      count: scores.length,
    }));

    return {
      trends,
      overall: responses.length > 0
        ? responses.reduce((sum, r) => sum + r.score, 0) / responses.length
        : 0,
    };
  }
}
