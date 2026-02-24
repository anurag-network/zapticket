import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public/chatbot')
export class PublicChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  @Post(':organizationSlug/session')
  async createSession(
    @Param('organizationSlug') organizationSlug: string,
    @Body('sessionId') sessionId?: string,
  ) {
    const result = await this.chatbotService.getOrCreateSession(
      organizationSlug,
      sessionId,
    );
    return {
      sessionId: result.sessionId,
      welcomeMessage: result.config.welcomeMessage,
      botName: result.config.botName,
      proactiveMessage: result.proactiveMessage,
      config: {
        enabled: result.config.enabled,
        multilingual: result.config.multilingual,
        handoffEnabled: result.config.handoffEnabled,
        kbEnabled: result.config.kbEnabled,
        leadCaptureEnabled: result.config.leadCaptureEnabled,
        defaultLanguage: result.config.defaultLanguage,
        supportedLanguages: result.config.supportedLanguages,
        primaryColor: result.config.primaryColor,
        position: result.config.position,
        avatarUrl: result.config.avatarUrl,
      },
    };
  }

  @Post('message')
  async sendMessage(
    @Body('sessionId') sessionId: string,
    @Body('message') message: string,
  ) {
    return this.chatbotService.processMessage(sessionId, message);
  }

  @Get('history/:sessionId')
  async getHistory(@Param('sessionId') sessionId: string) {
    return this.chatbotService.getChatHistory(sessionId);
  }

  @Post('lead')
  async captureLead(
    @Body() body: {
      conversationId: string;
      name?: string;
      email: string;
      phone?: string;
      company?: string;
      message?: string;
      source?: string;
      pageUrl?: string;
      data?: any;
    },
  ) {
    return this.chatbotService.captureLead(body.conversationId, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      company: body.company,
      message: body.message,
      source: body.source,
      pageUrl: body.pageUrl,
      data: body.data,
    });
  }
}

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(
    private chatbotService: ChatbotService,
    private prisma: PrismaService,
  ) {}

  @Get('config')
  async getConfig(@Request() req: any) {
    return this.chatbotService.getConfig(req.user.organizationId);
  }

  @Post('config')
  async updateConfig(@Request() req: any, @Body() config: any) {
    return this.chatbotService.updateConfig(req.user.organizationId, config);
  }

  @Post('dashboard/session')
  async createDashboardSession(@Request() req: any) {
    const organization = await this.prisma.organization.findFirst({
      where: { id: req.user.organizationId },
    });

    const result = await this.chatbotService.getOrCreateSession(
      organization?.slug || req.user.organizationId,
    );
    return {
      sessionId: result.sessionId,
      welcomeMessage: result.config.welcomeMessage,
      botName: result.config.botName,
    };
  }

  @Get('handoffs/pending')
  async getPendingHandoffs(@Request() req: any) {
    return this.chatbotService.getPendingHandoffs(req.user.organizationId);
  }

  @Post('handoffs/:id/accept')
  async acceptHandoff(
    @Request() req: any,
    @Param('id') handoffId: string,
  ) {
    return this.chatbotService.acceptHandoff(handoffId, req.user.id);
  }

  @Post('handoffs/:id/decline')
  async declineHandoff(
    @Request() req: any,
    @Param('id') handoffId: string,
    @Body('reason') reason?: string,
  ) {
    return this.chatbotService.declineHandoff(handoffId, req.user.id, reason);
  }

  @Post('handoffs/:id/end')
  async endHandoff(
    @Param('id') handoffId: string,
    @Body() body: { rating?: number; feedback?: string },
  ) {
    return this.chatbotService.endHandoff(handoffId, body.rating, body.feedback);
  }

  @Get('leads')
  async getLeads(
    @Request() req: any,
    @Query('contacted') contacted?: string,
  ) {
    const filters = contacted !== undefined ? { contacted: contacted === 'true' } : undefined;
    return this.chatbotService.getLeads(req.user.organizationId, filters);
  }

  @Post('leads/:id/contact')
  async markLeadContacted(@Param('id') leadId: string) {
    return this.chatbotService.markLeadContacted(leadId);
  }

  @Get('training')
  async getTrainingData(@Request() req: any) {
    const config = await this.prisma.chatbotConfig.findUnique({
      where: { organizationId: req.user.organizationId },
    });
    if (!config) return [];
    return this.chatbotService.getTrainingData(config.id);
  }

  @Post('training')
  async createTrainingData(
    @Request() req: any,
    @Body() data: {
      type: string;
      question: string;
      answer: string;
      keywords?: string[];
      priority?: number;
      articleId?: string;
    },
  ) {
    const config = await this.prisma.chatbotConfig.findUnique({
      where: { organizationId: req.user.organizationId },
    });
    if (!config) throw new Error('Chatbot config not found');
    return this.chatbotService.createTrainingData(config.id, data);
  }

  @Put('training/:id')
  async updateTrainingData(
    @Param('id') id: string,
    @Body() data: {
      type?: string;
      question?: string;
      answer?: string;
      keywords?: string[];
      priority?: number;
      active?: boolean;
    },
  ) {
    return this.chatbotService.updateTrainingData(id, data);
  }

  @Delete('training/:id')
  async deleteTrainingData(@Param('id') id: string) {
    return this.chatbotService.deleteTrainingData(id);
  }

  @Post('training/train-kb')
  async trainFromKB(@Request() req: any) {
    const config = await this.prisma.chatbotConfig.findUnique({
      where: { organizationId: req.user.organizationId },
    });
    if (!config) throw new Error('Chatbot config not found');
    return this.chatbotService.trainFromKB(config.id);
  }
}
