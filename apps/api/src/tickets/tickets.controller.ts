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
import { TicketInput, UpdateTicketInput, MessageInput, TicketFilters } from '@zapticket/shared';

@ApiTags('tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tickets')
export class TicketsController {
  constructor(
    private tickets: TicketsService,
    private messages: MessagesService
  ) {}

  @Get()
  @ApiOperation({ summary: 'List tickets' })
  findAll(@Req() req: any, @Query() filters: TicketFilters) {
    return this.tickets.findAll(req.user.organizationId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details' })
  findOne(@Param('id') id: string) {
    return this.tickets.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create ticket' })
  create(@Req() req: any, @Body() data: TicketInput) {
    return this.tickets.create(req.user.organizationId, req.user.id, data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket' })
  update(@Param('id') id: string, @Body() data: UpdateTicketInput) {
    return this.tickets.update(id, data);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get ticket messages' })
  getMessages(@Param('id') id: string) {
    return this.messages.findByTicket(id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Add message to ticket' })
  addMessage(@Param('id') id: string, @Req() req: any, @Body() data: MessageInput) {
    return this.messages.create(id, req.user.id, data);
  }
}
