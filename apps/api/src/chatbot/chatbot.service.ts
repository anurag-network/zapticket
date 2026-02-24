import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIProviderService } from './ai-provider.service';
import { EmailService } from '../email/email.service';
import { AssignmentService } from '../assignment/assignment.service';
import { ChatbotStatus, AIProvider } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ExtractedInfo {
  name?: string;
  email?: string;
  category?: string;
  description?: string;
  subject?: string;
}

interface LanguageDetection {
  language: string;
  confidence: number;
}

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly supportedLanguages = [
    'en', 'es', 'fr', 'de', 'pt', 'it', 'nl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'tr', 'pl', 'sv', 'da', 'fi', 'no', 'he'
  ];

  constructor(
    private prisma: PrismaService,
    private aiProvider: AIProviderService,
    private emailService: EmailService,
    private assignmentService: AssignmentService,
  ) {}

  async getOrCreateSession(
    organizationSlug: string,
    sessionId?: string,
  ): Promise<{ sessionId: string; config: any; conversation: any; proactiveMessage?: string }> {
    const organization = await this.prisma.organization.findUnique({
      where: { slug: organizationSlug },
      include: { chatbotConfig: true },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    let config = organization.chatbotConfig;
    if (!config) {
      config = await this.prisma.chatbotConfig.create({
        data: {
          organizationId: organization.id,
          botName: 'Zapdeck',
          welcomeMessage: "Hi! I'm Zapdeck, your support assistant. How can I help you today?",
          aiProvider: AIProvider.OPENAI,
          aiModel: 'gpt-4',
          enabled: true,
          handoffEnabled: true,
          proactiveChat: true,
          multilingual: true,
          kbEnabled: true,
          kbConfidenceThreshold: 0.7,
          leadCaptureEnabled: true,
          proactiveDelay: 5000,
          primaryColor: '#3b82f6',
          position: 'bottom-right',
          defaultLanguage: 'en',
          supportedLanguages: 'en,es,fr,de,pt,it,nl,zh,ja,ko',
        },
      });
    }

    let conversation = null;
    if (sessionId) {
      conversation = await this.prisma.chatConversation.findUnique({
        where: { sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    let proactiveMessage: string | undefined;
    if (!conversation && config.proactiveChat && config.proactiveMessage) {
      proactiveMessage = config.proactiveMessage;
    }

    if (!conversation) {
      const newSessionId = uuidv4();
      conversation = await this.prisma.chatConversation.create({
        data: {
          sessionId: newSessionId,
          organizationId: organization.id,
          chatbotConfigId: config.id,
          status: ChatbotStatus.GREETING,
          detectedLanguage: config.defaultLanguage || 'en',
        },
        include: { messages: true },
      });
    }

    return { sessionId: conversation.sessionId, config, conversation, proactiveMessage };
  }

  async processMessage(
    sessionId: string,
    userMessage: string,
  ): Promise<{
    reply: string;
    status: ChatbotStatus;
    ticketCreated?: boolean;
    ticketId?: string;
    language?: string;
    suggestedArticles?: any[];
    handoffRequested?: boolean;
  }> {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { sessionId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        chatbotConfig: true,
        organization: true,
      },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const config = conversation.chatbotConfig;
    let detectedLanguage = conversation.detectedLanguage;

    if (config.multilingual) {
      const langDetection = await this.detectLanguage(userMessage, config);
      if (langDetection) {
        detectedLanguage = langDetection.language;
        await this.prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { detectedLanguage },
        });
      }
    }

    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        content: userMessage,
        isBot: false,
        language: detectedLanguage,
      },
    });

    const extractedInfo = await this.extractInformation(userMessage, conversation);

    if (extractedInfo.email && config.leadCaptureEnabled) {
      await this.prisma.chatConversation.update({
        where: { id: conversation.id },
        data: { isLead: true },
      });
    }

    const shouldHandoff = this.checkForHandoffRequest(userMessage, config);
    if (shouldHandoff && config.handoffEnabled && !conversation.handoffRequested) {
      return this.requestHandoff(conversation, userMessage, extractedInfo);
    }

    let kbContext = '';
    let suggestedArticles: any[] = [];
    
    if (config.kbEnabled) {
      const kbResults = await this.searchKnowledgeBase(userMessage, conversation.organizationId, config);
      if (kbResults.length > 0) {
        kbContext = this.buildKBContext(kbResults);
        suggestedArticles = kbResults.slice(0, 3).map(a => ({ id: a.id, title: a.title, slug: a.slug }));
      }
    }

    const chatHistory: ChatMessage[] = conversation.messages.map(m => ({
      role: m.isBot ? 'assistant' : 'user',
      content: m.content,
    }));
    chatHistory.push({ role: 'user', content: userMessage });

    const systemPrompt = this.buildSystemPrompt(conversation.status, {
      name: conversation.visitorName,
      email: conversation.visitorEmail,
      category: conversation.category,
      description: conversation.description,
    }, kbContext, detectedLanguage);

    let aiResponse: string;
    try {
      const response = await this.aiProvider.generateResponse(
        {
          aiProvider: config.aiProvider,
          apiKey: config.aiApiKey,
          apiEndpoint: config.apiEndpoint,
          model: config.aiModel,
          temperature: 0.7,
          maxTokens: 500,
        } as any,
        [
          { role: 'system', content: systemPrompt },
          ...chatHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
      );
      aiResponse = response.content;
    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message}`);
      aiResponse = this.getFallbackResponse(userMessage, kbContext, detectedLanguage);
    }

    const updatedConversation = await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: {
        visitorName: extractedInfo.name ?? conversation.visitorName,
        visitorEmail: extractedInfo.email ?? conversation.visitorEmail,
        category: extractedInfo.category ?? conversation.category,
        description: extractedInfo.description ?? conversation.description,
        status: this.determineNextStatus(conversation.status, extractedInfo, conversation),
        updatedAt: new Date(),
      },
    });

    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        content: aiResponse,
        isBot: true,
        language: detectedLanguage,
      },
    });

    let ticketCreated = false;
    let ticketId: string | undefined;

    if (updatedConversation.status === ChatbotStatus.CREATING_TICKET) {
      const ticket = await this.createTicketFromConversation(updatedConversation);
      if (ticket) {
        ticketCreated = true;
        ticketId = ticket.id;
        aiResponse += `\n\nYour ticket has been created! Ticket ID: ${ticket.id}\nYou will receive a confirmation email shortly.`;

        await this.prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { status: ChatbotStatus.COMPLETED, ticketId: ticket.id },
        });

        await this.sendTicketConfirmationEmail(updatedConversation, ticket);
      }
    }

    return {
      reply: aiResponse,
      status: updatedConversation.status === ChatbotStatus.CREATING_TICKET ? ChatbotStatus.COMPLETED : updatedConversation.status,
      ticketCreated,
      ticketId,
      language: detectedLanguage,
      suggestedArticles: suggestedArticles.length > 0 ? suggestedArticles : undefined,
    };
  }

  private async detectLanguage(message: string, config: any): Promise<LanguageDetection | null> {
    const langPatterns: Record<string, RegExp> = {
      en: /\b(the|a|an|is|are|was|were|have|has|had|do|does|did|can|could|will|would|should)\b/i,
      es: /\b(el|la|los|las|un|una|es|son|está|están|hay|que|como)\b/i,
      fr: /\b(le|la|les|un|une|est|sont|être|avoir|que|qui|dans|pour)\b/i,
      de: /\b(der|die|das|ein|eine|ist|sind|sein|haben|werden|kann)\b/i,
      pt: /\b(o|a|os|as|um|uma|é|são|está|estão|ter|ser|que)\b/i,
      it: /\b(il|la|lo|gli|le|un|una|è|sono|essere|avere|che)\b/i,
      zh: /[\u4e00-\u9fff]/,
      ja: /[\u3040-\u309f\u30a0-\u30ff]/,
      ko: /[\uac00-\ud7af]/,
      ar: /[\u0600-\u06ff]/,
      ru: /[\u0400-\u04ff]/,
      hi: /[\u0900-\u097f]/,
    };

    const supported = (config.supportedLanguages || 'en').split(',').map((l: string) => l.trim());
    
    for (const lang of supported) {
      if (langPatterns[lang] && langPatterns[lang].test(message)) {
        return { language: lang, confidence: 0.8 };
      }
    }

    return { language: config.defaultLanguage || 'en', confidence: 0.5 };
  }

  private async searchKnowledgeBase(query: string, organizationId: string, config: any) {
    try {
      const articles = await this.prisma.article.findMany({
        where: {
          organizationId,
          published: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { excerpt: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          content: true,
          excerpt: true,
          slug: true,
        },
        take: 5,
      });

      return articles;
    } catch (error) {
      this.logger.error(`KB search failed: ${error.message}`);
      return [];
    }
  }

  private buildKBContext(articles: any[]): string {
    if (articles.length === 0) return '';
    
    let context = '\n\nRelevant Knowledge Base Articles:\n';
    articles.forEach((article, index) => {
      context += `\n--- Article ${index + 1}: ${article.title} ---\n`;
      context += article.excerpt || article.content.substring(0, 500);
      if (article.content.length > 500) {
        context += '...\n';
      }
    });
    
    return context;
  }

  private getFallbackResponse(query: string, kbContext: string, language: string): string {
    const responses: Record<string, { kb: string; fallback: string }> = {
      en: {
        kb: kbContext ? `Based on our knowledge base:${kbContext}\n\nDoes this help answer your question?` : '',
        fallback: "I'm having trouble processing your request. Would you like me to connect you with a live agent?",
      },
      es: {
        kb: kbContext ? `Según nuestra base de conocimientos:${kbContext}\n\n¿Esto responde a su pregunta?` : '',
        fallback: 'Tengo dificultades para procesar su solicitud. ¿Le gustaría que le conecte con un agente en vivo?',
      },
      fr: {
        kb: kbContext ? `Selon notre base de connaissances:${kbContext}\n\nCela répond-il à votre question?` : '',
        fallback: "J'ai du mal à traiter votre demande. Voulez-vous que je vous connecte à un agent en direct?",
      },
      de: {
        kb: kbContext ? `Basierend auf unserer Wissensdatenbank:${kbContext}\n\nBeantwortet das Ihre Frage?` : '',
        fallback: 'Ich habe Schwierigkeiten, Ihre Anfrage zu verarbeiten. Möchten Sie, dass ich Sie mit einem Live-Agenten verbinde?',
      },
    };

    const langResponses = responses[language] || responses['en'];
    return kbContext ? langResponses.kb : langResponses.fallback;
  }

  private checkForHandoffRequest(message: string, config: any): boolean {
    const handoffKeywords = [
      'talk to agent', 'talk to human', 'speak to agent', 'speak to human',
      'connect me', 'transfer to agent', 'need human', 'want human',
      'hablar con agente', 'parler à un agent', 'mit agenten sprechen',
      'я хочу оператора', '想要人工客服', '상담원과話하고 싶어요',
    ];
    
    const lowerMessage = message.toLowerCase();
    return handoffKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private async requestHandoff(
    conversation: any,
    userMessage: string,
    extractedInfo: ExtractedInfo,
  ): Promise<any> {
    const handoff = await this.prisma.agentHandoff.create({
      data: {
        conversationId: conversation.id,
        chatbotConfigId: conversation.chatbotConfigId,
        reason: userMessage,
        status: 'pending',
      },
    });

    await this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: {
        handoffRequested: true,
        handoffReason: userMessage,
      },
    });

    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        content: "I've connected you with a live agent. Please wait while they join the conversation.",
        isBot: true,
      },
    });

    return {
      reply: "I've connected you with a live agent. Please wait while they join the conversation.",
      status: conversation.status,
      handoffRequested: true,
      handoffId: handoff.id,
    };
  }

  async acceptHandoff(handoffId: string, agentId: string) {
    const handoff = await this.prisma.agentHandoff.update({
      where: { id: handoffId },
      data: {
        assignedToId: agentId,
        status: 'accepted',
        acceptedAt: new Date(),
      },
    });

    await this.prisma.chatConversation.update({
      where: { id: handoff.conversationId },
      data: { status: 'ACTIVE' },
    });

    return handoff;
  }

  async declineHandoff(handoffId: string, agentId: string, reason?: string) {
    return this.prisma.agentHandoff.update({
      where: { id: handoffId },
      data: {
        assignedToId: agentId,
        status: 'declined',
        notes: reason,
      },
    });
  }

  async endHandoff(handoffId: string, rating?: number, feedback?: string) {
    return this.prisma.agentHandoff.update({
      where: { id: handoffId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        rating,
        feedback,
      },
    });
  }

  async getPendingHandoffs(organizationId: string) {
    const configs = await this.prisma.chatbotConfig.findMany({
      where: { organizationId, handoffEnabled: true },
      include: {
        handoffs: {
          where: { status: 'pending' },
          include: {
            conversation: {
              include: {
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
    });

    return configs.flatMap(c => c.handoffs);
  }

  async captureLead(conversationId: string, leadData: {
    name?: string;
    email: string;
    phone?: string;
    company?: string;
    message?: string;
    source?: string;
    pageUrl?: string;
    data?: any;
  }) {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { id: conversationId },
      include: { chatbotConfig: true },
    });

    if (!conversation) {
      throw new BadRequestException('Conversation not found');
    }

    const lead = await this.prisma.leadCapture.create({
      data: {
        organizationId: conversation.organizationId,
        chatbotConfigId: conversation.chatbotConfigId,
        conversationId: conversation.id,
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        company: leadData.company,
        message: leadData.message,
        source: leadData.source || 'chatbot',
        pageUrl: leadData.pageUrl,
        data: leadData.data,
      },
    });

    await this.prisma.chatConversation.update({
      where: { id: conversationId },
      data: { isLead: true },
    });

    return lead;
  }

  async getLeads(organizationId: string, filters?: { contacted?: boolean }) {
    const where: any = { organizationId };
    if (filters?.contacted !== undefined) {
      where.contacted = filters.contacted;
    }

    return this.prisma.leadCapture.findMany({
      where,
      include: { conversation: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markLeadContacted(leadId: string) {
    return this.prisma.leadCapture.update({
      where: { id: leadId },
      data: { contacted: true },
    });
  }

  async getTrainingData(configId: string) {
    return this.prisma.chatbotTraining.findMany({
      where: { configId },
      orderBy: { priority: 'desc' },
    });
  }

  async createTrainingData(configId: string, data: {
    type: string;
    question: string;
    answer: string;
    keywords?: string[];
    priority?: number;
    articleId?: string;
  }) {
    return this.prisma.chatbotTraining.create({
      data: {
        configId,
        type: data.type,
        question: data.question,
        answer: data.answer,
        keywords: data.keywords || [],
        priority: data.priority || 0,
        articleId: data.articleId,
      },
    });
  }

  async updateTrainingData(id: string, data: {
    type?: string;
    question?: string;
    answer?: string;
    keywords?: string[];
    priority?: number;
    active?: boolean;
  }) {
    return this.prisma.chatbotTraining.update({
      where: { id },
      data,
    });
  }

  async deleteTrainingData(id: string) {
    return this.prisma.chatbotTraining.delete({ where: { id } });
  }

  async trainFromKB(configId: string) {
    const config = await this.prisma.chatbotConfig.findUnique({
      where: { id: configId },
      include: { organization: true },
    });

    if (!config) {
      throw new BadRequestException('Config not found');
    }

    const articles = await this.prisma.article.findMany({
      where: {
        organizationId: config.organizationId,
        published: true,
      },
    });

    const trainingData = await Promise.all(
      articles.map(async (article) => {
        const existing = await this.prisma.chatbotTraining.findFirst({
          where: { configId, articleId: article.id },
        });

        if (existing) {
          return this.prisma.chatbotTraining.update({
            where: { id: existing.id },
            data: {
              question: article.title,
              answer: article.content.substring(0, 2000),
            },
          });
        }

        return this.prisma.chatbotTraining.create({
          data: {
            configId,
            type: 'kb_article',
            question: article.title,
            answer: article.content.substring(0, 2000),
            keywords: article.title.toLowerCase().split(' '),
            articleId: article.id,
          },
        });
      })
    );

    return { trained: trainingData.length, articles };
  }

  private buildSystemPrompt(
    status: ChatbotStatus,
    existingInfo: ExtractedInfo,
    kbContext: string,
    language: string,
  ): string {
    const botName = 'Zapdeck';
    
    const languageGreetings: Record<string, string> = {
      en: 'Hello! I\'m Zapdeck, your support assistant.',
      es: '¡Hola! Soy Zapdeck, tu asistente de soporte.',
      fr: 'Bonjour! Je suis Zapdeck, votre assistant de support.',
      de: 'Hallo! Ich bin Zapdeck, Ihr Support-Assistent.',
      pt: 'Olá! Sou o Zapdeck, seu assistente de suporte.',
      it: 'Ciao! Sono Zapdeck, il tuo assistente di supporto.',
      zh: '你好！我是Zapdeck，您的支持助手。',
      ja: 'こんにちは！私はZapdeckです。サポートアシスタントです。',
      ko: '안녕하세요! 저는 Zapdeck입니다. 지원 도우미입니다.',
    };

    const greeting = languageGreetings[language] || languageGreetings.en;
    
    let prompt = `You are ${botName}, a friendly and helpful support chatbot.

Language: ${language}

${greeting} Your goal is to help users create support tickets or find answers from our knowledge base.
${kbContext}

Current conversation status: ${status}
Already collected information:
- Name: ${existingInfo.name || 'Not collected'}
- Email: ${existingInfo.email || 'Not collected'}
- Category/Department: ${existingInfo.category || 'Not collected'}
- Issue Description: ${existingInfo.description || 'Not collected'}

INSTRUCTIONS:
1. Be friendly, professional, and concise
2. If the user asks about something covered in the knowledge base articles above, summarize the relevant information
3. If the knowledge base doesn't have a clear answer, help them create a support ticket
4. Collect the following REQUIRED information one by one:
   - User's full name
   - User's email address
   - Category/Department (options: Technical Support, Billing, General Inquiry, Feature Request, Bug Report, Other)
   - Detailed description of their issue
5. After collecting all required information, confirm the details with the user
6. Keep responses short (2-3 sentences max unless providing information)

When you have all the information, summarize it and ask if it's correct before creating the ticket.`;

    return prompt;
  }

  private async extractInformation(
    message: string,
    conversation: any,
  ): Promise<ExtractedInfo> {
    const info: ExtractedInfo = {};

    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = message.match(emailRegex);
    if (emails && emails.length > 0 && !conversation.visitorEmail) {
      info.email = emails[0];
    }

    const categories = [
      'Technical Support',
      'Billing',
      'General Inquiry',
      'Feature Request',
      'Bug Report',
      'Other',
    ];
    const lowerMessage = message.toLowerCase();
    for (const cat of categories) {
      if (lowerMessage.includes(cat.toLowerCase()) && !conversation.category) {
        info.category = cat;
        break;
      }
    }

    if (message.length > 20 && !conversation.description && conversation.visitorName && conversation.visitorEmail) {
      if (!emailRegex.test(message) && !categories.some(c => lowerMessage.includes(c.toLowerCase()))) {
        info.description = message;
      }
    }

    if (!conversation.visitorName && message.length > 0 && message.length < 50 && !emailRegex.test(message)) {
      const words = message.trim().split(/\s+/);
      if (words.length >= 2 && words.every(w => /^[A-Za-z]+$/.test(w))) {
        const name = message.trim();
        if (!categories.some(c => name.toLowerCase().includes(c.toLowerCase().split(' ')[0]))) {
          info.name = name;
        }
      }
    }

    return info;
  }

  private determineNextStatus(
    currentStatus: ChatbotStatus,
    newInfo: ExtractedInfo,
    conversation: any,
  ): ChatbotStatus {
    const hasName = conversation.visitorName || newInfo.name;
    const hasEmail = conversation.visitorEmail || newInfo.email;
    const hasCategory = conversation.category || newInfo.category;
    const hasDescription = conversation.description || newInfo.description;

    if (hasName && hasEmail && hasCategory && hasDescription) {
      return ChatbotStatus.CREATING_TICKET;
    }

    if (hasName || hasEmail || hasCategory || hasDescription) {
      return ChatbotStatus.COLLECTING_INFO;
    }

    return currentStatus;
  }

  private async createTicketFromConversation(conversation: any): Promise<any> {
    try {
      const channel = await this.prisma.channel.findFirst({
        where: {
          organizationId: conversation.organizationId,
          type: 'CHAT',
        },
      });

      if (!channel) {
        await this.prisma.channel.create({
          data: {
            type: 'CHAT',
            name: 'Chat',
            organizationId: conversation.organizationId,
          },
        });
      }

      const ticket = await this.prisma.ticket.create({
        data: {
          subject: conversation.category || 'Support Request',
          description: conversation.description || 'Created via chatbot',
          organizationId: conversation.organizationId,
          channelId: channel?.id,
        },
      });

      await this.assignmentService.autoAssignTicket(ticket.id);

      this.logger.log(`Created ticket ${ticket.id} from chat conversation ${conversation.id}`);

      return ticket;
    } catch (error) {
      this.logger.error(`Failed to create ticket: ${error.message}`);
      return null;
    }
  }

  private async sendTicketConfirmationEmail(conversation: any, ticket: any): Promise<void> {
    if (!conversation.visitorEmail) {
      this.logger.warn('No email to send ticket confirmation to');
      return;
    }

    try {
      await this.emailService.sendEmail({
        to: conversation.visitorEmail,
        subject: `Ticket Created: ${ticket.subject} [#${ticket.id}]`,
        html: `
          <h2>Your Support Ticket Has Been Created</h2>
          <p>Hello ${conversation.visitorName || 'there'},</p>
          <p>Thank you for contacting us. Your support ticket has been successfully created.</p>
          
          <h3>Ticket Details:</h3>
          <ul>
            <li><strong>Ticket ID:</strong> ${ticket.id}</li>
            <li><strong>Subject:</strong> ${ticket.subject}</li>
            <li><strong>Category:</strong> ${conversation.category || 'N/A'}</li>
            <li><strong>Status:</strong> Open</li>
            <li><strong>Created:</strong> ${new Date().toLocaleString()}</li>
          </ul>
          
          <h3>Your Issue:</h3>
          <p>${conversation.description}</p>
          
          <p>Our team will review your ticket and get back to you as soon as possible.</p>
          
          <p>Best regards,<br>The Support Team</p>
        `,
      });

      this.logger.log(`Sent ticket confirmation email to ${conversation.visitorEmail}`);
    } catch (error) {
      this.logger.error(`Failed to send confirmation email: ${error.message}`);
    }
  }

  async getChatHistory(sessionId: string): Promise<any[]> {
    const conversation = await this.prisma.chatConversation.findUnique({
      where: { sessionId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation) {
      return [];
    }

    return conversation.messages.map(m => ({
      content: m.content,
      isBot: m.isBot,
      timestamp: m.createdAt,
      language: m.language,
    }));
  }

  async updateConfig(organizationId: string, config: any): Promise<any> {
    const existing = await this.prisma.chatbotConfig.findUnique({
      where: { organizationId },
    });

    if (existing) {
      return this.prisma.chatbotConfig.update({
        where: { organizationId },
        data: {
          botName: config.botName,
          welcomeMessage: config.welcomeMessage,
          offlineMessage: config.offlineMessage,
          aiProvider: config.aiProvider,
          aiApiKey: config.aiApiKey,
          aiApiEndpoint: config.aiEndpoint,
          aiModel: config.aiModel,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          enabled: config.enabled,
          handoffEnabled: config.handoffEnabled,
          proactiveChat: config.proactiveChat,
          multilingual: config.multilingual,
          kbEnabled: config.kbEnabled,
          kbConfidenceThreshold: config.kbConfidenceThreshold,
          leadCaptureEnabled: config.leadCaptureEnabled,
          leadFields: config.leadFields,
          proactiveDelay: config.proactiveDelay,
          proactiveTriggers: config.proactiveTriggers,
          proactiveMessage: config.proactiveMessage,
          primaryColor: config.primaryColor,
          position: config.position,
          avatarUrl: config.avatarUrl,
          defaultLanguage: config.defaultLanguage,
          supportedLanguages: config.supportedLanguages,
        },
      });
    }

    return this.prisma.chatbotConfig.create({
      data: {
        organizationId,
        botName: config.botName || 'Zapdeck',
        welcomeMessage: config.welcomeMessage,
        offlineMessage: config.offlineMessage,
        aiProvider: config.aiProvider,
        aiApiKey: config.aiApiKey,
        aiApiEndpoint: config.aiEndpoint,
        aiModel: config.aiModel || 'gpt-4',
        temperature: config.temperature || 0.7,
        maxTokens: config.maxTokens || 500,
        enabled: config.enabled ?? true,
        handoffEnabled: config.handoffEnabled ?? true,
        proactiveChat: config.proactiveChat ?? true,
        multilingual: config.multilingual ?? true,
        kbEnabled: config.kbEnabled ?? true,
        kbConfidenceThreshold: config.kbConfidenceThreshold ?? 0.7,
        leadCaptureEnabled: config.leadCaptureEnabled ?? true,
        leadFields: config.leadFields,
        proactiveDelay: config.proactiveDelay ?? 5000,
        proactiveTriggers: config.proactiveTriggers,
        proactiveMessage: config.proactiveMessage,
        primaryColor: config.primaryColor || '#3b82f6',
        position: config.position || 'bottom-right',
        avatarUrl: config.avatarUrl,
        defaultLanguage: config.defaultLanguage || 'en',
        supportedLanguages: config.supportedLanguages || 'en,es,fr,de,pt,it,nl',
      },
    });
  }

  async getConfig(organizationId: string): Promise<any> {
    return this.prisma.chatbotConfig.findUnique({
      where: { organizationId },
    });
  }
}
