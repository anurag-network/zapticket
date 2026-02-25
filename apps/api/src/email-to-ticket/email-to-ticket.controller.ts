import { Controller, Post, Body, Headers, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EmailToTicketService } from './email-to-ticket.service';

@ApiTags('Email to Ticket')
@Controller('email')
export class EmailToTicketController {
  constructor(private emailToTicket: EmailToTicketService) {}

  @Post('incoming')
  @HttpCode(200)
  @ApiOperation({ summary: 'Process incoming email and create/update ticket' })
  async processEmail(
    @Body() body: {
      from: string;
      to: string;
      subject: string;
      text?: string;
      html?: string;
      attachments?: any[];
    },
    @Headers('x-organization-id') organizationId: string
  ) {
    if (!organizationId) {
      throw new Error('Organization ID required');
    }

    return this.emailToTicket.processIncomingEmail(body, organizationId);
  }
}
