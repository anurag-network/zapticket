import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';
import { TicketInput, UpdateTicketInput, MessageInput, TicketFilters } from '@zapticket/shared';

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(
    private tickets: TicketsService,
    private messages: MessagesService
  ) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'List tickets' })
  findAll(@Req() req: any, @Query() filters: TicketFilters) {
    return this.tickets.findAll(req.user.organizationId, filters);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Get ticket details' })
  findOne(@Param('id') id: string) {
    return this.tickets.findOne(id);
  }

  @Post()
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Create ticket' })
  create(@Req() req: any, @Body() data: TicketInput) {
    return this.tickets.create(req.user.organizationId, req.user.id, data);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Update ticket' })
  update(@Param('id') id: string, @Body() data: UpdateTicketInput) {
    return this.tickets.update(id, data);
  }

  @Get(':id/messages')
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Get ticket messages' })
  getMessages(@Param('id') id: string) {
    return this.messages.findByTicket(id);
  }

  @Post(':id/messages')
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Add message to ticket' })
  addMessage(@Param('id') id: string, @Req() req: any, @Body() data: MessageInput) {
    return this.messages.create(id, req.user.id, data);
  }
}
