import { Controller, Post, Body, UseGuards, Req, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('email')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('email')
export class EmailController {
  constructor(private email: EmailService) {}

  @Post('send')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Send an email' })
  async sendEmail(
    @Body() data: { to: string; subject: string; html: string; replyTo?: string }
  ) {
    return this.email.sendEmail(data);
  }

  @Post('send-ticket-reply')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Send ticket reply email' })
  async sendTicketReply(
    @Body() data: { ticketId: string; to: string; subject: string; message: string }
  ) {
    const ticketUrl = `${process.env.WEB_URL}/tickets/${data.ticketId}`;
    return this.email.sendTicketReply({
      ...data,
      ticketUrl,
    });
  }
}
