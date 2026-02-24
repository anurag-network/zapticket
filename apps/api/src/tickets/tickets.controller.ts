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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';
import { TicketInput, UpdateTicketInput, MessageInput, TicketFilters } from '@zapticket/shared';
import { CreateTicketDto, UpdateTicketDto, TicketResponseDto, CreateMessageDto, MessageResponseDto } from '../dtos/ticket.dto';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
@ApiExtraModels(TicketResponseDto, MessageResponseDto)
export class TicketsController {
  constructor(
    private tickets: TicketsService,
    private messages: MessagesService
  ) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'List all tickets with optional filters' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filter by priority' })
  @ApiQuery({ name: 'assigneeId', required: false, description: 'Filter by assignee' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in subject and description' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'List of tickets' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@Req() req: any, @Query() filters: TicketFilters) {
    return this.tickets.findAll(req.user.organizationId, filters);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Get ticket details by ID' })
  @ApiResponse({ status: 200, description: 'Ticket details', type: TicketResponseDto })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  findOne(@Param('id') id: string) {
    return this.tickets.findOne(id);
  }

  @Post()
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Create a new ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created', type: TicketResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Req() req: any, @Body() data: TicketInput) {
    return this.tickets.create(req.user.organizationId, req.user.id, data);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Update ticket properties' })
  @ApiResponse({ status: 200, description: 'Ticket updated', type: TicketResponseDto })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  update(@Param('id') id: string, @Body() data: UpdateTicketInput) {
    return this.tickets.update(id, data);
  }

  @Get(':id/messages')
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Get all messages for a ticket' })
  @ApiResponse({ status: 200, description: 'List of messages' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  getMessages(@Param('id') id: string) {
    return this.messages.findByTicket(id);
  }

  @Post(':id/messages')
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Add a reply or internal note to a ticket' })
  @ApiResponse({ status: 201, description: 'Message added', type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  addMessage(@Param('id') id: string, @Req() req: any, @Body() data: MessageInput) {
    return this.messages.create(id, req.user.id, data);
  }
}
