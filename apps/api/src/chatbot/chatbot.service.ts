import { Injectable, Logger } from '@nestjs/common';
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

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private prisma: PrismaService,
    private aiProvider: AIProviderService,
    private emailService: EmailService,
    private assignmentService: AssignmentService,
  ) {}

  async getOrCreateSession(
    organizationSlug: string,
    sessionId?: string,
  ): Promise<{ sessionId: string; config: any; conversation: any }> {
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
          name: 'Zapdeck',
          welcomeMessage: "Hi! I'm Zapdeck, your support assistant. How can I help you today?",
          aiProvider: AIProvider.OPENAI,
          model: 'gpt-4',
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

    if (!conversation) {
      const newSessionId = uuidv4();
      conversation = await this.prisma.chatConversation.create({
        data: {
          sessionId: newSessionId,
          organizationId: organization.id,
          chatbotConfigId: config.id,
          status: ChatbotStatus.GREETING,
        },
        include: { messages: true },
      });
    }

    return { sessionId: conversation.sessionId, config, conversation };
  }

  async processMessage(
    sessionId: string,
    userMessage: string,
  ): Promise<{ reply: string; status: ChatbotStatus; ticketCreated?: boolean; ticketId?: string }> {
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

    await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        content: userMessage,
        isBot: false,
      },
    });

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
    });

    let aiResponse: string;
    try {
      const response = await this.aiProvider.generateResponse(
        conversation.chatbotConfig,
        [
          { role: 'system', content: systemPrompt },
          ...chatHistory.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
      );
      aiResponse = response.content;
    } catch (error) {
      this.logger.error(`AI generation failed: ${error.message}`);
      aiResponse = "I'm having trouble processing your request. Please try again or contact support directly.";
    }

    const extractedInfo = await this.extractInformation(userMessage, conversation);

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
    };
  }

  private buildSystemPrompt(status: ChatbotStatus, existingInfo: ExtractedInfo): string {
    const botName = 'Zapdeck';
    
    let prompt = `You are ${botName}, a friendly and helpful support chatbot. Your goal is to help users create support tickets.

Current conversation status: ${status}
Already collected information:
- Name: ${existingInfo.name || 'Not collected'}
- Email: ${existingInfo.email || 'Not collected'}
- Category/Department: ${existingInfo.category || 'Not collected'}
- Issue Description: ${existingInfo.description || 'Not collected'}

INSTRUCTIONS:
1. Be friendly, professional, and concise
2. Greet users warmly if this is the start of the conversation
3. Collect the following REQUIRED information one by one (don't ask for everything at once):
   - User's full name
   - User's email address
   - Category/Department (options: Technical Support, Billing, General Inquiry, Feature Request, Bug Report, Other)
   - Detailed description of their issue or concern
4. After collecting all required information, confirm the details with the user
5. Once confirmed, let them know you'll create a support ticket
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
          name: config.name,
          welcomeMessage: config.welcomeMessage,
          aiProvider: config.aiProvider,
          apiKey: config.apiKey,
          apiEndpoint: config.apiEndpoint,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          active: config.active,
        },
      });
    }

    return this.prisma.chatbotConfig.create({
      data: {
        organizationId,
        name: config.name || 'Zapdeck',
        welcomeMessage: config.welcomeMessage,
        aiProvider: config.aiProvider,
        apiKey: config.apiKey,
        apiEndpoint: config.apiEndpoint,
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        active: config.active ?? true,
      },
    });
  }

  async getConfig(organizationId: string): Promise<any> {
    return this.prisma.chatbotConfig.findUnique({
      where: { organizationId },
    });
  }
}
