import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Customer360Service } from './customer-360.service';

@Controller('customers')
@UseGuards(JwtAuthGuard)
export class Customer360Controller {
  constructor(private customer360Service: Customer360Service) {}

  @Get('360/:customerId')
  async getCustomer360(
    @Param('customerId') customerId: string,
    @Request() req: any,
  ) {
    return this.customer360Service.getCustomer360(customerId, req.user.organizationId);
  }

  @Get('search')
  async searchCustomers(
    @Query('q') query: string,
    @Request() req: any,
  ) {
    return this.customer360Service.searchCustomers(req.user.organizationId, query);
  }

  @Get('by-email')
  async getCustomerByEmail(
    @Query('email') email: string,
    @Request() req: any,
  ) {
    return this.customer360Service.getCustomerByEmail(email, req.user.organizationId);
  }

  @Get(':customerId/interactions')
  async getInteractions(
    @Param('customerId') customerId: string,
    @Query('type') type?: string,
  ) {
    return this.customer360Service.getInteractionsTimeline(customerId, type);
  }

  @Post(':customerId/notes')
  async addNote(
    @Param('customerId') customerId: string,
    @Body('content') content: string,
    @Request() req: any,
  ) {
    return this.customer360Service.addNote(customerId, content, req.user.id);
  }
}
