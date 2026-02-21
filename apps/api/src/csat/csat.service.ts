import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CSATService {
  constructor(private prisma: PrismaService) {}

  async createSurvey(ticketId: string, organizationId: string, customerId?: string) {
    const existing = await this.prisma.cSATSurvey.findUnique({
      where: { ticketId },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.cSATSurvey.create({
      data: {
        ticketId,
        organizationId,
        customerId,
        rating: 0,
      },
    });
  }

  async submitResponse(
    surveyId: string,
    rating: number,
    comment?: string,
    customerId?: string
  ) {
    const survey = await this.prisma.cSATSurvey.findUnique({
      where: { id: surveyId },
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    await this.prisma.cSATSurvey.update({
      where: { id: surveyId },
      data: { rating, comment, customerId },
    });

    if (customerId) {
      await this.prisma.cSATResponse.create({
        data: {
          surveyId,
          customerId,
          rating,
          comment,
        },
      });
    }

    return { success: true };
  }

  async getSurvey(surveyId: string) {
    return this.prisma.cSATSurvey.findUnique({
      where: { id: surveyId },
      include: {
        ticket: { select: { id: true, subject: true } },
      },
    });
  }

  async getTicketSurvey(ticketId: string) {
    return this.prisma.cSATSurvey.findUnique({
      where: { ticketId },
    });
  }

  async getOrganizationStats(organizationId: string, days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const surveys = await this.prisma.cSATSurvey.findMany({
      where: {
        organizationId,
        createdAt: { gte: since },
        rating: { gt: 0 },
      },
    });

    if (surveys.length === 0) {
      return {
        totalResponses: 0,
        averageRating: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        csatScore: 0,
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRating = 0;

    surveys.forEach((s) => {
      if (s.rating >= 1 && s.rating <= 5) {
        distribution[s.rating as keyof typeof distribution]++;
        totalRating += s.rating;
      }
    });

    const averageRating = totalRating / surveys.length;
    const satisfiedCount = distribution[4] + distribution[5];
    const csatScore = (satisfiedCount / surveys.length) * 100;

    return {
      totalResponses: surveys.length,
      averageRating: Number(averageRating.toFixed(2)),
      distribution,
      csatScore: Number(csatScore.toFixed(1)),
    };
  }

  async getRecentResponses(organizationId: string, limit: number = 20) {
    return this.prisma.cSATSurvey.findMany({
      where: {
        organizationId,
        rating: { gt: 0 },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        ticket: { select: { id: true, subject: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
