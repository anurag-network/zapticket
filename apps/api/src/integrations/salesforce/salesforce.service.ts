import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface SalesforceConfig {
  instanceUrl: string;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class SalesforceService {
  private readonly logger = new Logger(SalesforceService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async getConfig(organizationId: string): Promise<SalesforceConfig | null> {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const salesforce = org?.settings?.salesforce as SalesforceConfig | undefined;
    return salesforce || null;
  }

  async authenticate(organizationId: string, credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    authCode: string;
  }): Promise<any> {
    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: credentials.redirectUri,
        code: credentials.authCode,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to authenticate with Salesforce');
    }

    const data = await response.json();
    
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          salesforce: {
            instanceUrl: data.instance_url,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
          },
        },
      },
    });

    return { success: true };
  }

  private async refreshToken(organizationId: string): Promise<string> {
    const config = await this.getConfig(organizationId);
    if (!config) throw new Error('Salesforce not configured');

    const response = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.configService.get('SALESFORCE_CLIENT_ID') || '',
        client_secret: this.configService.get('SALESFORCE_CLIENT_SECRET') || '',
        refresh_token: config.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Salesforce token');
    }

    const data = await response.json();
    
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          salesforce: {
            ...config,
            accessToken: data.access_token,
          },
        },
      },
    });

    return data.access_token;
  }

  private async makeRequest(organizationId: string, endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const config = await this.getConfig(organizationId);
    if (!config) throw new Error('Salesforce not configured');

    let accessToken = config.accessToken;
    
    try {
      return await this.callSalesforce(config.instanceUrl, accessToken, endpoint, method, body);
    } catch (error: any) {
      if (error.message.includes('401')) {
        accessToken = await this.refreshToken(organizationId);
        return this.callSalesforce(config.instanceUrl, accessToken, endpoint, method, body);
      }
      throw error;
    }
  }

  private async callSalesforce(instanceUrl: string, token: string, endpoint: string, method: string, body?: any): Promise<any> {
    const response = await fetch(`${instanceUrl}/services/data/v58.0${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Salesforce API error: ${error}`);
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
    const query = `SELECT Id FROM Contact WHERE Email = '${contactData.email}'`;
    
    try {
      const result = await this.makeRequest(organizationId, `/query?q=${encodeURIComponent(query)}`);
      
      if (result.totalSize > 0) {
        const contactId = result.records[0].Id;
        return this.makeRequest(organizationId, `/sobjects/Contact/${contactId}`, 'PATCH', {
          FirstName: contactData.firstName,
          LastName: contactData.lastName,
          Phone: contactData.phone,
        });
      } else {
        return this.makeRequest(organizationId, '/sobjects/Contact', 'POST', {
          Email: contactData.email,
          FirstName: contactData.firstName,
          LastName: contactData.lastName,
          Phone: contactData.phone,
        });
      }
    } catch (error) {
      this.logger.error(`Failed to sync contact: ${error.message}`);
      throw error;
    }
  }

  async createCase(organizationId: string, caseData: {
    contactEmail: string;
    subject: string;
    description: string;
    priority?: string;
  }): Promise<any> {
    const query = `SELECT Id FROM Contact WHERE Email = '${caseData.contactEmail}'`;
    
    try {
      const result = await this.makeRequest(organizationId, `/query?q=${encodeURIComponent(query)}`);
      
      const caseRecord: any = {
        Subject: caseData.subject,
        Description: caseData.description,
        Priority: caseData.priority || 'Medium',
        Origin: 'Web',
      };

      if (result.totalSize > 0) {
        caseRecord.ContactId = result.records[0].Id;
      } else {
        caseRecord.SuppliedEmail = caseData.contactEmail;
      }

      return this.makeRequest(organizationId, '/sobjects/Case', 'POST', caseRecord);
    } catch (error) {
      this.logger.error(`Failed to create case: ${error.message}`);
      throw error;
    }
  }

  async getCases(organizationId: string, contactEmail: string): Promise<any[]> {
    const query = `SELECT Id, CaseNumber, Subject, Status, Priority, CreatedDate 
                   FROM Case 
                   WHERE Contact.Email = '${contactEmail}'
                   ORDER BY CreatedDate DESC
                   LIMIT 10`;

    try {
      const result = await this.makeRequest(organizationId, `/query?q=${encodeURIComponent(query)}`);
      return result.records;
    } catch (error) {
      this.logger.error(`Failed to get cases: ${error.message}`);
      return [];
    }
  }

  async createTask(organizationId: string, taskData: {
    subject: string;
    description?: string;
    dueDate?: string;
    priority?: string;
    relatedTo?: string;
  }): Promise<any> {
    return this.makeRequest(organizationId, '/sobjects/Task', 'POST', {
      Subject: taskData.subject,
      Description: taskData.description,
      ActivityDate: taskData.dueDate,
      Priority: taskData.priority || 'Normal',
      Status: 'Not Started',
      WhatId: taskData.relatedTo,
    });
  }

  async disconnect(organizationId: string): Promise<void> {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          salesforce: null,
        },
      },
    });
  }
}
