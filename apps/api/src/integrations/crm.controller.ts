import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesforceService } from './salesforce.service';
import { HubSpotService } from './hubspot.service';

@Controller('integrations/crm')
@UseGuards(JwtAuthGuard)
export class CRMController {
  constructor(
    private salesforceService: SalesforceService,
    private hubspotService: HubSpotService,
  ) {}

  @Post('salesforce/connect')
  async connectSalesforce(
    @Request() req: any,
    @Body() body: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      authCode: string;
    },
  ) {
    return this.salesforceService.authenticate(req.user.organizationId, body);
  }

  @Post('salesforce/disconnect')
  async disconnectSalesforce(@Request() req: any) {
    return this.salesforceService.disconnect(req.user.organizationId);
  }

  @Post('salesforce/sync-contact')
  async syncSalesforceContact(
    @Request() req: any,
    @Body() body: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      company?: string;
    },
  ) {
    return this.salesforceService.syncContact(req.user.organizationId, body);
  }

  @Post('salesforce/create-case')
  async createSalesforceCase(
    @Request() req: any,
    @Body() body: {
      contactEmail: string;
      subject: string;
      description: string;
      priority?: string;
    },
  ) {
    return this.salesforceService.createCase(req.user.organizationId, body);
  }

  @Get('salesforce/cases')
  async getSalesforceCases(
    @Request() req: any,
    @Query('email') email: string,
  ) {
    return this.salesforceService.getCases(req.user.organizationId, email);
  }

  @Post('hubspot/connect')
  async connectHubspot(
    @Request() req: any,
    @Body() body: { accessToken: string },
  ) {
    return this.hubspotService.authenticate(req.user.organizationId, body.accessToken);
  }

  @Post('hubspot/disconnect')
  async disconnectHubspot(@Request() req: any) {
    return this.hubspotService.disconnect(req.user.organizationId);
  }

  @Post('hubspot/sync-contact')
  async syncHubspotContact(
    @Request() req: any,
    @Body() body: {
      email: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      company?: string;
    },
  ) {
    return this.hubspotService.syncContact(req.user.organizationId, body);
  }

  @Post('hubspot/create-ticket')
  async createHubspotTicket(
    @Request() req: any,
    @Body() body: {
      contactEmail: string;
      subject: string;
      description: string;
      priority?: string;
    },
  ) {
    return this.hubspotService.createTicket(req.user.organizationId, body);
  }

  @Get('hubspot/tickets')
  async getHubspotTickets(
    @Request() req: any,
    @Query('email') email: string,
  ) {
    return this.hubspotService.getTickets(req.user.organizationId, email);
  }
}
