import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CustomerPortalService } from './customer-portal.service';
import { OptionalAuthGuard } from './optional-auth.guard';

@Controller('portal')
export class CustomerPortalController {
  constructor(private customerPortalService: CustomerPortalService) {}

  @Post('register')
  async register(
    @Body('organizationId') organizationId: string,
    @Body('email') email: string,
    @Body('name') name: string,
    @Body('password') password: string,
    @Body('phone') phone?: string
  ) {
    return this.customerPortalService.register(organizationId, email, name, password, phone);
  }

  @Post('login')
  async login(
    @Body('organizationId') organizationId: string,
    @Body('email') email: string,
    @Body('password') password: string
  ) {
    return this.customerPortalService.login(organizationId, email, password);
  }

  @Get('profile')
  @UseGuards(OptionalAuthGuard)
  async getProfile(@Request() req: any) {
    return this.customerPortalService.getProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(OptionalAuthGuard)
  async updateProfile(
    @Request() req: any,
    @Body() body: { name?: string; phone?: string }
  ) {
    return this.customerPortalService.updateProfile(req.user.id, body);
  }

  @Get('tickets')
  @UseGuards(OptionalAuthGuard)
  async getTickets(@Request() req: any) {
    return this.customerPortalService.getTickets(req.user.id);
  }

  @Get('tickets/:id')
  @UseGuards(OptionalAuthGuard)
  async getTicket(@Request() req: any, @Param('id') ticketId: string) {
    return this.customerPortalService.getTicket(req.user.id, ticketId);
  }

  @Post('tickets')
  @UseGuards(OptionalAuthGuard)
  async createTicket(
    @Request() req: any,
    @Body() body: { subject: string; description: string; type?: string }
  ) {
    return this.customerPortalService.createTicket(
      req.user.id,
      req.user.organizationId,
      body.subject,
      body.description,
      body.type
    );
  }

  @Post('tickets/:id/reply')
  @UseGuards(OptionalAuthGuard)
  async addReply(
    @Request() req: any,
    @Param('id') ticketId: string,
    @Body('content') content: string
  ) {
    return this.customerPortalService.addReply(req.user.id, ticketId, content);
  }
}
