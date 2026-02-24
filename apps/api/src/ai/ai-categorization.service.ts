import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AIProvider } from '@prisma/client';

interface CategoryResult {
  category: string;
  confidence: number;
  suggestedTags: string[];
  suggestedPriority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  suggestedAssigneeId?: string;
}

@Injectable()
export class AICategorizationService {
  private readonly logger = new Logger(AICategorizationService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async categorizeTicket(ticketId: string): Promise<CategoryResult> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, take: 10 },
        organization: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const conversation = ticket.messages
      .map((m) => m.content)
      .join('\n');

    const prompt = `Analyze this support ticket and provide categorization.

TICKET INFO:
- Subject: ${ticket.subject}
- Description: ${ticket.description}
- Organization: ${ticket.organization.name}

CONVERSATION:
${conversation || 'No messages yet'}

CATEGORIES available:
- Technical Support
- Billing
- Account
- Feature Request
- Bug Report
- Sales Inquiry
- General Inquiry

PRIORITIES: LOW, NORMAL, HIGH, URGENT

Provide JSON:
{
  "category": "Category Name",
  "confidence": 0.0-1.0,
  "suggestedTags": ["tag1", "tag2"],
  "suggestedPriority": "LOW|NORMAL|HIGH|URGENT"
}`;

    try {
      const config = await this.getAIConfig(ticket.organizationId);
      const response = await this.callAI(config, prompt);
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.getDefaultCategory();
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        category: parsed.category || 'General Inquiry',
        confidence: parsed.confidence || 0.5,
        suggestedTags: parsed.suggestedTags || [],
        suggestedPriority: parsed.suggestedPriority || 'NORMAL',
      };
    } catch (error) {
      this.logger.error(`Categorization failed: ${error.message}`);
      return this.getDefaultCategory();
    }
  }

  async autoCategorizeOnCreate(ticketId: string): Promise<void> {
    try {
      const result = await this.categorizeTicket(ticketId);
      
      if (result.confidence > 0.6) {
        const existingTags = await this.prisma.ticket.findUnique({
          where: { id: ticketId },
          include: { tags: { include: { tag: true } } },
        });

        const existingTagNames = existingTags?.tags.map(t => t.tag.name) || [];
        const newTags = result.suggestedTags.filter(t => !existingTagNames.includes(t));

        if (newTags.length > 0) {
          for (const tagName of newTags) {
            const tag = await this.prisma.tag.upsert({
              where: { 
                name_organizationId: { name: tagName, organizationId: existingTags!.organizationId } 
              },
              create: { name: tagName, organizationId: existingTags!.organizationId },
              update: {},
            });

            await this.prisma.ticketTag.create({
              data: { ticketId, tagId: tag.id },
            });
          }
        }

        if (result.suggestedPriority !== 'NORMAL') {
          await this.prisma.ticket.update({
            where: { id: ticketId },
            data: { priority: result.suggestedPriority },
          });
        }
      }
    } catch (error) {
      this.logger.error(`Auto-categorization failed: ${error.message}`);
    }
  }

  async suggestAssignment(ticketId: string): Promise<string | null> {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: { organization: true },
      });

      if (!ticket) return null;

      const category = await this.categorizeTicket(ticketId);

      const agents = await this.prisma.user.findMany({
        where: {
          organizationId: ticket.organizationId,
          role: { in: ['AGENT', 'ADMIN'] },
        },
        include: {
          assignedTickets: {
            where: { status: { notIn: ['CLOSED', 'RESOLVED'] } },
          },
        },
      });

      if (agents.length === 0) return null;

      const skills = await this.prisma.team.findMany({
        where: { organizationId: ticket.organizationId },
        include: { members: true },
      });

      const leastBusy = agents
        .map(a => ({
          id: a.id,
          workload: a.assignedTickets.length,
        }))
        .sort((a, b) => a.workload - b.workload)[0];

      return leastBusy?.id || null;
    } catch (error) {
      this.logger.error(`Assignment suggestion failed: ${error.message}`);
      return null;
    }
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
      temperature: 0.3,
      maxTokens: 500,
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

  private getDefaultCategory(): CategoryResult {
    return {
      category: 'General Inquiry',
      confidence: 0.3,
      suggestedTags: [],
      suggestedPriority: 'NORMAL',
    };
  }
}
