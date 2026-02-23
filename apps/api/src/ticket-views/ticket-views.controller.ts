import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketViewsService } from './ticket-views.service';

@Controller('ticket-views')
@UseGuards(JwtAuthGuard)
export class TicketViewsController {
  constructor(private ticketViewsService: TicketViewsService) {}

  @Post()
  async create(
    @Request() req: any,
    @Body()
    body: {
      name: string;
      icon?: string;
      color?: string;
      filters: Record<string, any>;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      isShared?: boolean;
      columns?: { field: string; label?: string; visible?: boolean; width?: number }[];
    },
  ) {
    return this.ticketViewsService.create(req.user.organizationId, req.user.id, body);
  }

  @Get()
  async findAll(@Request() req: any, @Query('shared') shared?: string) {
    if (shared === 'true') {
      return this.ticketViewsService.findSharedViews(req.user.organizationId);
    }

    if (shared === 'false') {
      return this.ticketViewsService.findUserViews(req.user.organizationId, req.user.id);
    }

    return this.ticketViewsService.findByOrganization(req.user.organizationId, req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') viewId: string) {
    return this.ticketViewsService.findOne(viewId);
  }

  @Get(':id/tickets')
  async getTickets(
    @Param('id') viewId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ticketViewsService.getTicketsForView(viewId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }

  @Put(':id')
  async update(
    @Param('id') viewId: string,
    @Body()
    body: {
      name?: string;
      icon?: string;
      color?: string;
      filters?: Record<string, any>;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      isShared?: boolean;
    },
  ) {
    return this.ticketViewsService.update(viewId, body);
  }

  @Put(':id/columns')
  async updateColumns(
    @Param('id') viewId: string,
    @Body() body: { field: string; label?: string; visible?: boolean; width?: number }[],
  ) {
    return this.ticketViewsService.updateColumns(viewId, body);
  }

  @Post(':id/default')
  async setAsDefault(@Param('id') viewId: string, @Request() req: any) {
    return this.ticketViewsService.setAsDefault(viewId, req.user.organizationId);
  }

  @Post(':id/duplicate')
  async duplicate(@Param('id') viewId: string, @Request() req: any) {
    return this.ticketViewsService.duplicate(viewId, req.user.id);
  }

  @Post('reorder')
  async reorder(@Request() req: any, @Body() body: { viewIds: string[] }) {
    return this.ticketViewsService.reorderViews(req.user.organizationId, body.viewIds);
  }

  @Delete(':id')
  async delete(@Param('id') viewId: string) {
    return this.ticketViewsService.delete(viewId);
  }
}
