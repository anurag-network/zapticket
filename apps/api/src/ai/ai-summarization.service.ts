import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AIProvider } from '@prisma/client';

interface TicketSummary {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: string;
  generatedAt: Date;
}

@Injectable()
export class AISummarizationService {
  private readonly logger = new Logger(AISummarizationService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async summarizeTicket(ticketId: string): Promise<TicketSummary> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        customerProfile: true,
        assignee: true,
        organization: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const conversation = ticket.messages
      .map((m) => `${m.author?.name || 'Customer'}: ${m.content}`)
      .join('\n\n');

    const prompt = `Analyze this support ticket conversation and provide a structured summary.

TICKET INFO:
- Subject: ${ticket.subject}
- Status: ${ticket.status}
- Priority: ${ticket.priority}
- Customer: ${ticket.customerProfile?.name || ticket.customerProfile?.email || 'Unknown'}
- Created: ${ticket.createdAt.toLocaleString()}

CONVERSATION:
${conversation || ticket.description}

Provide a JSON response with:
{
  "summary": "A 2-3 sentence summary of what this ticket is about",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "actionItems": ["Action 1", "Action 2"],
  "sentiment": "positive|neutral|negative"
}

Return ONLY valid JSON.`;

    try {
      const aiConfig = await this.getAIConfig(ticket.organizationId);
      const response = await this.callAI(aiConfig, prompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getDefaultSummary(ticket);
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      const summary: TicketSummary = {
        summary: parsed.summary || 'No summary available',
        keyPoints: parsed.keyPoints || [],
        actionItems: parsed.actionItems || [],
        sentiment: parsed.sentiment || 'neutral',
        generatedAt: new Date(),
      };

      await this.saveSummaryToDatabase(ticketId, summary);

      return summary;
    } catch (error) {
      this.logger.error(`Summarization failed: ${error.message}`);
      return this.getDefaultSummary(ticket);
    }
  }

  async getCachedSummary(ticketId: string): Promise<TicketSummary | null> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { 
        subject: true, 
        description: true,
        updatedAt: true 
      },
    });

    if (!ticket) return null;

    return {
      summary: ticket.description.substring(0, 200),
      keyPoints: [],
      actionItems: [],
      sentiment: 'neutral',
      generatedAt: ticket.updatedAt,
    };
  }

  private async saveSummaryToDatabase(ticketId: string, summary: TicketSummary): Promise<void> {
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        description: `[AI Summary: ${summary.summary}]\n\n${await this.getOriginalDescription(ticketId)}`,
      },
    });
  }

  private async getOriginalDescription(ticketId: string): Promise<string> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { description: true },
    });
    return ticket?.description || '';
  }

  private async getAIConfig(organizationId: string) {
    const config = await this.prisma.chatbotConfig.findFirst({
      where: { organizationId },
    });

    return {
      aiProvider: config?.aiProvider || AIProvider.OPENAI,
      apiKey: config?.aiApiKey || this.configService.get('OPENAI_API_KEY'),
      apiEndpoint: config?.apiEndpoint,
      model: config?.aiModel || 'gpt-4',
      temperature: 0.5,
      maxTokens: 1000,
    };
  }

  private async callAI(config: any, prompt: string): Promise<string> {
    const { aiProvider, ...rest } = config;
    
    switch (aiProvider) {
      case AIProvider.OPENAI:
        return this.callOpenAI(rest, prompt);
      case AIProvider.ANTHROPIC:
        return this.callAnthropic(rest, prompt);
      case AIProvider.OLLAMA:
        return this.callOllama(rest, prompt);
      default:
        throw new Error(`Unsupported provider: ${aiProvider}`);
    }
  }

  private async callOpenAI(config: any, prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert support ticket analyst. Return valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  private async callAnthropic(config: any, prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-sonnet-20240229',
        max_tokens: config.maxTokens,
        system: 'You are an expert support ticket analyst. Return valid JSON only.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  private async callOllama(config: any, prompt: string): Promise<string> {
    const endpoint = config.apiEndpoint || 'http://localhost:11434';
    
    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'llama2',
        messages: [
          { role: 'system', content: 'You are an expert support ticket analyst.' },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  }

  private getDefaultSummary(ticket: any): TicketSummary {
    return {
      summary: ticket.description?.substring(0, 200) || 'Support ticket',
      keyPoints: [],
      actionItems: [],
      sentiment: 'neutral',
      generatedAt: new Date(),
    };
  }
}
