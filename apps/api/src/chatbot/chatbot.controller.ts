import {
  Controller,
  Get,
  Post,
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
      botName: result.config.name,
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
      botName: result.config.name,
    };
  }
}
