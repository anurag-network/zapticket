import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AIProvider } from '@prisma/client';
import { AIProviderService } from '../chatbot/ai-provider.service';

interface ResponseSuggestion {
  content: string;
  source: 'ai' | 'knowledge_base' | 'canned' | 'similar_tickets';
  confidence: number;
}

@Injectable()
export class SmartResponseService {
  private readonly logger = new Logger(SmartResponseService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private aiProvider: AIProviderService,
  ) {}

  async getSuggestions(ticketId: string): Promise<ResponseSuggestion[]> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
        tags: { include: { tag: true } },
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const suggestions: ResponseSuggestion[] = [];

    const knowledgeBaseSuggestions = await this.searchKnowledgeBase(ticket);
    suggestions.push(...knowledgeBaseSuggestions);

    const aiSuggestions = await this.generateAIResponses(ticket);
    suggestions.push(...aiSuggestions);

    const similarTicketSuggestions = await this.findSimilarTicketResponses(ticket);
    suggestions.push(...similarTicketSuggestions);

    const sorted = suggestions.sort((a, b) => b.confidence - a.confidence);

    await this.storeSuggestions(ticketId, sorted.slice(0, 5));

    return sorted.slice(0, 5);
  }

  private async searchKnowledgeBase(ticket: any): Promise<ResponseSuggestion[]> {
    try {
      const articles = await this.prisma.article.findMany({
        where: {
          organizationId: ticket.organizationId,
          published: true,
        },
        take: 3,
      });

      const searchTerms = this.extractKeywords(ticket.description);
      
      const relevantArticles = articles.filter((article) =>
        searchTerms.some((term) =>
          article.title.toLowerCase().includes(term) ||
          article.content.toLowerCase().includes(term)
        )
      );

      return relevantArticles.map((article) => ({
        content: this.formatArticleAsResponse(article),
        source: 'knowledge_base' as const,
        confidence: 0.8,
      }));
    } catch (error) {
      this.logger.error(`Knowledge base search failed: ${error.message}`);
      return [];
    }
  }

  private extractKeywords(text: string): string[] {
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am'];

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.includes(word))
      .slice(0, 10);
  }

  private formatArticleAsResponse(article: any): string {
    const excerpt = article.excerpt || article.content.substring(0, 300);
    return `Based on our knowledge base article "${article.title}":\n\n${excerpt}...\n\nYou can read more in our help center.`;
  }

  private async generateAIResponses(ticket: any): Promise<ResponseSuggestion[]> {
    try {
      const config = await this.getAIConfig();
      
      const conversation = ticket.messages
        .map((m: any) => `${m.type === 'NOTE' ? '(Internal Note)' : ''} ${m.content}`)
        .join('\n');

      const prompt = `You are a helpful support agent. Based on this support ticket, suggest 2 professional, empathetic response options.

Ticket Subject: ${ticket.subject}
Ticket Description: ${ticket.description}
Priority: ${ticket.priority}

Recent Messages:
${conversation || 'No messages yet'}

Generate 2 different response options. Each should be:
- Professional and empathetic
- Address the customer's concern
- Offer a clear next step or solution

Format as JSON array:
[{"response": "...", "tone": "friendly|professional|urgent"}]`;

      const response = await this.aiProvider.generateResponse(config, [
        { role: 'system', content: 'You are an expert customer support agent. Generate helpful response suggestions in valid JSON only.' },
        { role: 'user', content: prompt },
      ]);

      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const suggestions = JSON.parse(jsonMatch[0]);
      
      return suggestions.map((s: any, i: number) => ({
        content: s.response,
        source: 'ai' as const,
        confidence: 0.9 - (i * 0.1),
      }));
    } catch (error) {
      this.logger.error(`AI response generation failed: ${error.message}`);
      return [];
    }
  }

  private async findSimilarTicketResponses(ticket: any): Promise<ResponseSuggestion[]> {
    try {
      const keywords = this.extractKeywords(ticket.description + ' ' + ticket.subject);
      
      const similarTickets = await this.prisma.$queryRaw<any[]>`
        SELECT DISTINCT t.id, t.subject, m.content
        FROM "Ticket" t
        JOIN "Message" m ON m."ticketId" = t.id
        WHERE t."organizationId" = ${ticket.organizationId}
        AND t.status IN ('RESOLVED', 'CLOSED')
        AND m.type = 'REPLY'
        AND (
          ${keywords.map(() => `t.description ILIKE '%' || ? || '%'`).join(' OR ')}
        )
        ORDER BY t."createdAt" DESC
        LIMIT 3
      `;

      return similarTickets.map((t) => ({
        content: `From a similar resolved ticket:\n\n${t.content.substring(0, 500)}...`,
        source: 'similar_tickets' as const,
        confidence: 0.6,
      }));
    } catch (error) {
      this.logger.error(`Similar ticket search failed: ${error.message}`);
      return [];
    }
  }

  private async getAIConfig() {
    const config = await this.prisma.chatbotConfig.findFirst();
    return {
      aiProvider: config?.aiProvider || AIProvider.OPENAI,
      apiKey: config?.apiKey || this.configService.get('OPENAI_API_KEY'),
      model: config?.model || 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
    };
  }

  private async storeSuggestions(ticketId: string, suggestions: ResponseSuggestion[]): Promise<void> {
    for (const suggestion of suggestions.slice(0, 5)) {
      await this.prisma.responseSuggestion.create({
        data: {
          ticketId,
          content: suggestion.content,
          source: suggestion.source,
          confidence: suggestion.confidence,
        },
      });
    }
  }

  async markSuggestionUsed(suggestionId: string): Promise<void> {
    await this.prisma.responseSuggestion.update({
      where: { id: suggestionId },
      data: { used: true },
    });
  }

  async getStoredSuggestions(ticketId: string) {
    return this.prisma.responseSuggestion.findMany({
      where: { ticketId, used: false },
      orderBy: { confidence: 'desc' },
      take: 5,
    });
  }
}
