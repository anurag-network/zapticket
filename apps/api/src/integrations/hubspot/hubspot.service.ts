import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface HubSpotConfig {
  accessToken: string;
  portalId: string;
}

@Injectable()
export class HubSpotService {
  private readonly logger = new Logger(HubSpotService.name);
  private readonly baseUrl = 'https://api.hubapi.com';

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getConfig(organizationId: string): Promise<HubSpotConfig | null> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const hubspot = org?.settings?.hubspot as HubSpotConfig | undefined;
    return hubspot || null;
  }

  async authenticate(organizationId: string, accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/account-info/v3/details`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with HubSpot');
    }

    const data = await response.json();
    
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          hubspot: {
            accessToken,
            portalId: data.portalId,
          },
        },
      },
    });

    return { success: true, portalId: data.portalId };
  }

  private async makeRequest(organizationId: string, endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const config = await this.getConfig(organizationId);
    if (!config) throw new Error('HubSpot not configured');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HubSpot API error: ${error}`);
    }

    return response.json();
  }

  async syncContact(organizationId: string, contactData: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    company?: string;
  }): Promise<any> {
    const properties: Record<string, string> = {
      email: contactData.email,
    };

    if (contactData.firstName) properties.firstname = contactData.firstName;
    if (contactData.lastName) properties.lastname = contactData.lastName;
    if (contactData.phone) properties.phone = contactData.phone;
    if (contactData.company) properties.company = contactData.company;

    try {
      const searchResponse = await this.makeRequest(organizationId, '/crm/v3/objects/contacts/search', 'POST', {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: contactData.email,
          }],
        }],
      });

      if (searchResponse.total > 0) {
        const contactId = searchResponse.results[0].id;
        return this.makeRequest(organizationId, `/crm/v3/objects/contacts/${contactId}`, 'PATCH', { properties });
      } else {
        return this.makeRequest(organizationId, '/crm/v3/objects/contacts', 'POST', { properties });
      }
    } catch (error) {
      this.logger.error(`Failed to sync contact: ${error.message}`);
      throw error;
    }
  }

  async createTicket(organizationId: string, ticketData: {
    contactEmail: string;
    subject: string;
    description: string;
    priority?: string;
  }): Promise<any> {
    const properties: Record<string, string> = {
      subject: ticketData.subject,
      content: ticketData.description,
      hs_pipeline_stage: 'new',
    };

    if (ticketData.priority) {
      properties.hs_ticket_priority = ticketData.priority.toLowerCase();
    }

    try {
      const searchResponse = await this.makeRequest(organizationId, '/crm/v3/objects/contacts/search', 'POST', {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: ticketData.contactEmail,
          }],
        }],
      });

      let associations = [];
      if (searchResponse.total > 0) {
        const contactId = searchResponse.results[0].id;
        associations = [{
          to: { id: contactId },
          types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }],
        }];
      }

      return this.makeRequest(organizationId, '/crm/v3/objects/tickets', 'POST', {
        properties,
        associations,
      });
    } catch (error) {
      this.logger.error(`Failed to create ticket: ${error.message}`);
      throw error;
    }
  }

  async getTickets(organizationId: string, contactEmail: string): Promise<any[]> {
    try {
      const searchResponse = await this.makeRequest(organizationId, '/crm/v3/objects/contacts/search', 'POST', {
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ',
            value: contactEmail,
          }],
        }],
        associations: ['tickets'],
      });

      if (searchResponse.total === 0) return [];

      const contactId = searchResponse.results[0].id;
      
      const ticketsResponse = await this.makeRequest(organizationId, `/crm/v3/objects/contacts/${contactId}/associations/tickets`, 'GET');
      
      if (!ticketsResponse.results?.length) return [];

      const ticketIds = ticketsResponse.results.map((r: any) => r.id).join(',');
      
      return this.makeRequest(organizationId, `/crm/v3/objects/tickets?Id=${ticketIds}&properties=subject,content,hs_ticket_priority,hs_pipeline_stage,createdate`, 'GET');
    } catch (error) {
      this.logger.error(`Failed to get tickets: ${error.message}`);
      return [];
    }
  }

  async createCompany(organizationId: string, companyData: {
    name: string;
    domain?: string;
    phone?: string;
  }): Promise<any> {
    const properties: Record<string, string> = {
      name: companyData.name,
    };

    if (companyData.domain) properties.domain = companyData.domain;
    if (companyData.phone) properties.phone = companyData.phone;

    try {
      const searchResponse = await this.makeRequest(organizationId, '/crm/v3/objects/companies/search', 'POST', {
        filterGroups: [{
          filters: [{
            propertyName: 'name',
            operator: 'EQ',
            value: companyData.name,
          }],
        }],
      });

      if (searchResponse.total > 0) {
        return searchResponse.results[0];
      }

      return this.makeRequest(organizationId, '/crm/v3/objects/companies', 'POST', { properties });
    } catch (error) {
      this.logger.error(`Failed to create company: ${error.message}`);
      throw error;
    }
  }

  async createTimelineEvent(organizationId: string, eventData: {
    eventType: string;
    email: string;
    title: string;
    description?: string;
  }): Promise<any> {
    const config = await this.getConfig(organizationId);
    if (!config) throw new Error('HubSpot not configured');

    const searchResponse = await this.makeRequest(organizationId, '/crm/v3/objects/contacts/search', 'POST', {
      filterGroups: [{
        filters: [{
          propertyName: 'email',
          operator: 'EQ',
          value: eventData.email,
        }],
      }],
    });

    if (searchResponse.total === 0) {
      throw new Error('Contact not found');
    }

    const contactId = searchResponse.results[0].id;

    return this.makeRequest(organizationId, '/crm/v3/timeline/events', 'POST', {
      eventTemplateId: eventData.eventType,
      objectId: contactId,
      tokens: {
        title: eventData.title,
        description: eventData.description || '',
      },
    });
  }

  async disconnect(organizationId: string): Promise<void> {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          hubspot: null,
        },
      },
    });
  }
}
