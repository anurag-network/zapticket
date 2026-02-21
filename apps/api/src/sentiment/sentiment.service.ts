import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SentimentType, AIProvider } from '@prisma/client';
import { AIProviderService } from '../chatbot/ai-provider.service';
import { EscalationService } from '../escalation/escalation.service';

interface SentimentResult {
  score: number;
  type: SentimentType;
  confidence: number;
  keywords: string[];
}

@Injectable()
export class SentimentService {
  private readonly logger = new Logger(SentimentService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private aiProvider: AIProviderService,
    private escalationService: EscalationService,
  ) {}

  async analyzeSentiment(text: string): Promise<SentimentResult> {
    const prompt = `Analyze the sentiment of the following customer support message. Return a JSON object with:
- score: number from -1 (very negative) to 1 (very positive)
- type: one of "VERY_NEGATIVE", "NEGATIVE", "NEUTRAL", "POSITIVE", "VERY_POSITIVE"
- confidence: number from 0 to 1
- keywords: array of emotional keywords found

Message: "${text}"

Return only the JSON object, no other text.`;

    try {
      const config = await this.getAIConfig();
      const response = await this.aiProvider.generateResponse(config, [
        { role: 'system', content: 'You are a sentiment analysis expert. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ]);

      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getDefaultSentiment();
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return {
        score: Math.max(-1, Math.min(1, result.score || 0)),
        type: this.validateSentimentType(result.type),
        confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
      };
    } catch (error) {
      this.logger.error(`Sentiment analysis failed: ${error.message}`);
      return this.getDefaultSentiment();
    }
  }

  private validateSentimentType(type: string): SentimentType {
    const validTypes = ['VERY_NEGATIVE', 'NEGATIVE', 'NEUTRAL', 'POSITIVE', 'VERY_POSITIVE'];
    if (validTypes.includes(type)) {
      return type as SentimentType;
    }
    return SentimentType.NEUTRAL;
  }

  private getDefaultSentiment(): SentimentResult {
    return {
      score: 0,
      type: SentimentType.NEUTRAL,
      confidence: 0.5,
      keywords: [],
    };
  }

  private async getAIConfig() {
    const config = await this.prisma.chatbotConfig.findFirst();
    return {
      aiProvider: config?.aiProvider || AIProvider.OPENAI,
      apiKey: config?.apiKey || this.configService.get('OPENAI_API_KEY'),
      model: config?.model || 'gpt-4',
      temperature: 0.3,
      maxTokens: 200,
    };
  }

  async analyzeTicket(ticketId: string): Promise<SentimentResult> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const allText = [
      ticket.description,
      ...ticket.messages.map((m) => m.content),
    ].join('\n\n');

    const sentiment = await this.analyzeSentiment(allText);

    await this.prisma.sentimentScore.create({
      data: {
        ticketId,
        score: sentiment.score,
        type: sentiment.type,
        confidence: sentiment.confidence,
        keywords: sentiment.keywords,
      },
    });

    if (sentiment.type === 'VERY_NEGATIVE' && sentiment.confidence > 0.7) {
      await this.autoEscalateNegativeTicket(ticketId, sentiment);
    }

    await this.updateCustomerHealthFromSentiment(ticketId, sentiment);

    return sentiment;
  }

  async analyzeMessage(messageId: string): Promise<SentimentResult> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { ticket: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const sentiment = await this.analyzeSentiment(message.content);

    await this.prisma.sentimentScore.create({
      data: {
        messageId,
        ticketId: message.ticketId,
        score: sentiment.score,
        type: sentiment.type,
        confidence: sentiment.confidence,
        keywords: sentiment.keywords,
      },
    });

    return sentiment;
  }

  private async autoEscalateNegativeTicket(ticketId: string, sentiment: SentimentResult): Promise<void> {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (ticket && ticket.status !== 'ESCALATED') {
        await this.escalationService.escalateTicket(
          ticketId,
          `Auto-escalated: Very negative customer sentiment detected (score: ${sentiment.score.toFixed(2)}, confidence: ${(sentiment.confidence * 100).toFixed(0)}%)`,
          true,
        );

        this.logger.warn(`Auto-escalated ticket ${ticketId} due to negative sentiment`);
      }
    } catch (error) {
      this.logger.error(`Failed to auto-escalate ticket: ${error.message}`);
    }
  }

  private async updateCustomerHealthFromSentiment(ticketId: string, sentiment: SentimentResult): Promise<void> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { customerProfile: true },
    });

    if (!ticket?.customerProfileId) return;

    const profile = ticket.customerProfile;
    if (!profile) return;

    const sentimentImpact = (sentiment.score + 1) / 2;
    const currentScore = profile.healthScore;
    const newScore = currentScore * 0.8 + sentimentImpact * 20;

    await this.prisma.customerProfile.update({
      where: { id: profile.id },
      data: {
        healthScore: Math.max(0, Math.min(100, newScore)),
        healthStatus: this.getHealthStatus(newScore),
      },
    });

    await this.prisma.customerHealthHistory.create({
      data: {
        customerProfileId: profile.id,
        score: newScore,
        status: this.getHealthStatus(newScore),
        reason: `Ticket ${ticketId} sentiment: ${sentiment.type}`,
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

  async getTicketSentimentHistory(ticketId: string) {
    return this.prisma.sentimentScore.findMany({
      where: { ticketId },
      orderBy: { analyzedAt: 'desc' },
    });
  }

  async getOrganizationSentimentStats(organizationId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { organizationId },
      include: {
        sentimentScores: {
          orderBy: { analyzedAt: 'desc' },
          take: 1,
        },
      },
    });

    const sentiments = tickets
      .filter((t) => t.sentimentScores.length > 0)
      .map((t) => t.sentimentScores[0]);

    const avgScore = sentiments.length > 0
      ? sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length
      : 0;

    const distribution = {
      VERY_NEGATIVE: 0,
      NEGATIVE: 0,
      NEUTRAL: 0,
      POSITIVE: 0,
      VERY_POSITIVE: 0,
    };

    sentiments.forEach((s) => {
      distribution[s.type]++;
    });

    return {
      averageScore: avgScore,
      totalAnalyzed: sentiments.length,
      distribution,
      trend: avgScore > 0.2 ? 'positive' : avgScore < -0.2 ? 'negative' : 'neutral',
    };
  }
}
