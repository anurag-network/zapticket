import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ImportOptions {
  createUsers?: boolean;
  createCustomers?: boolean;
  defaultStatus?: string;
  defaultPriority?: string;
  skipDuplicates?: boolean;
  dateFormat?: string;
}

interface ParsedTicket {
  externalId?: string;
  subject: string;
  description: string;
  status?: string;
  priority?: string;
  type?: string;
  createdAt?: Date;
  requesterEmail?: string;
  requesterName?: string;
  assigneeEmail?: string;
  tags?: string[];
  messages?: {
    content: string;
    createdAt?: Date;
    authorEmail?: string;
    authorName?: string;
    type?: string;
  }[];
}

@Injectable()
export class DataImportService {
  constructor(private prisma: PrismaService) {}

  async createImport(
    organizationId: string,
    userId: string,
    source: string,
    fileName: string,
    fileSize: number,
    fieldMapping?: Record<string, any>,
    options?: ImportOptions,
  ) {
    return this.prisma.dataImport.create({
      data: {
        organizationId,
        createdById: userId,
        source: source as any,
        fileName,
        fileSize,
        fieldMapping: fieldMapping as any,
        options: options as any,
      },
    });
  }

  async getImports(organizationId: string) {
    return this.prisma.dataImport.findMany({
      where: { organizationId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getImport(importId: string) {
    return this.prisma.dataImport.findUnique({
      where: { id: importId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        organization: true,
      },
    });
  }

  async startImport(importId: string) {
    const dataImport = await this.getImport(importId);
    if (!dataImport) {
      throw new BadRequestException('Import not found');
    }

    if (dataImport.status !== 'PENDING') {
      throw new BadRequestException('Import already started');
    }

    await this.prisma.dataImport.update({
      where: { id: importId },
      data: {
        status: 'PROCESSING',
        startedAt: new Date(),
      },
    });

    return dataImport;
  }

  async processZendeskExport(importId: string, data: any) {
    await this.startImport(importId);

    const dataImport = await this.getImport(importId);
    if (!dataImport) throw new BadRequestException('Import not found');

    const options = (dataImport.options as ImportOptions) || {};
    const mapping = (dataImport.fieldMapping as Record<string, string>) || {};
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      const tickets = data.tickets || data;

      for (const ticket of tickets) {
        try {
          const parsed = this.parseZendeskTicket(ticket, mapping);
          await this.importTicket(dataImport.organizationId, parsed, options, dataImport.createdById);
          processed++;
        } catch (err) {
          failed++;
          errors.push(`Ticket ${ticket.id || 'unknown'}: ${err.message}`);
        }

        if (processed % 50 === 0) {
          await this.prisma.dataImport.update({
            where: { id: importId },
            data: { processedRecords: processed, failedRecords: failed },
          });
        }
      }

      await this.prisma.dataImport.update({
        where: { id: importId },
        data: {
          status: 'COMPLETED',
          processedRecords: processed,
          failedRecords: failed,
          errorLog: errors.length > 0 ? errors.slice(0, 100).join('\n') : null,
          completedAt: new Date(),
        },
      });

      return { processed, failed, errors };
    } catch (err) {
      await this.prisma.dataImport.update({
        where: { id: importId },
        data: {
          status: 'FAILED',
          errorLog: err.message,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }

  parseZendeskTicket(ticket: any, mapping: Record<string, string>): ParsedTicket {
    return {
      externalId: ticket.id?.toString(),
      subject: ticket.subject || ticket[mapping.subject] || 'No Subject',
      description: ticket.description || ticket[mapping.description] || '',
      status: this.mapZendeskStatus(ticket.status || ticket[mapping.status]),
      priority: this.mapZendeskPriority(ticket.priority || ticket[mapping.priority]),
      type: this.mapZendeskType(ticket.type || ticket[mapping.type]),
      createdAt: ticket.created_at ? new Date(ticket.created_at) : undefined,
      requesterEmail: ticket.requester?.email || ticket[mapping.requesterEmail],
      requesterName: ticket.requester?.name || ticket[mapping.requesterName],
      assigneeEmail: ticket.assignee?.email || ticket[mapping.assigneeEmail],
      tags: ticket.tags || [],
      messages: (ticket.comments || []).map((c: any) => ({
        content: c.body || c.html_body || '',
        createdAt: c.created_at ? new Date(c.created_at) : undefined,
        authorEmail: c.author?.email,
        authorName: c.author?.name,
        type: c.public === false ? 'NOTE' : 'REPLY',
      })),
    };
  }

  async processZammadExport(importId: string, data: any) {
    await this.startImport(importId);

    const dataImport = await this.getImport(importId);
    if (!dataImport) throw new BadRequestException('Import not found');

    const options = (dataImport.options as ImportOptions) || {};
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      const tickets = Array.isArray(data) ? data : data.tickets || [];

      for (const ticket of tickets) {
        try {
          const parsed = this.parseZammadTicket(ticket);
          await this.importTicket(dataImport.organizationId, parsed, options, dataImport.createdById);
          processed++;
        } catch (err) {
          failed++;
          errors.push(`Ticket ${ticket.id || 'unknown'}: ${err.message}`);
        }

        if (processed % 50 === 0) {
          await this.prisma.dataImport.update({
            where: { id: importId },
            data: { processedRecords: processed, failedRecords: failed },
          });
        }
      }

      await this.prisma.dataImport.update({
        where: { id: importId },
        data: {
          status: 'COMPLETED',
          processedRecords: processed,
          failedRecords: failed,
          errorLog: errors.length > 0 ? errors.slice(0, 100).join('\n') : null,
          completedAt: new Date(),
        },
      });

      return { processed, failed, errors };
    } catch (err) {
      await this.prisma.dataImport.update({
        where: { id: importId },
        data: {
          status: 'FAILED',
          errorLog: err.message,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }

  parseZammadTicket(ticket: any): ParsedTicket {
    return {
      externalId: ticket.id?.toString(),
      subject: ticket.title || 'No Subject',
      description: ticket.article?.body || '',
      status: this.mapZammadState(ticket.state?.name || ticket.state),
      priority: this.mapZammadPriority(ticket.priority?.name || ticket.priority),
      createdAt: ticket.created_at ? new Date(ticket.created_at) : undefined,
      requesterEmail: ticket.customer?.email,
      requesterName: ticket.customer?.firstname ? `${ticket.customer.firstname} ${ticket.customer.lastname || ''}`.trim() : ticket.customer?.login,
      assigneeEmail: ticket.owner?.email,
      tags: ticket.tags?.map((t: any) => t.name || t) || [],
      messages: (ticket.articles || []).map((a: any) => ({
        content: a.body || '',
        createdAt: a.created_at ? new Date(a.created_at) : undefined,
        authorEmail: a.created_by?.email,
        authorName: a.created_by?.firstname ? `${a.created_by.firstname} ${a.created_by.lastname || ''}`.trim() : a.created_by?.login,
        type: a.internal ? 'NOTE' : 'REPLY',
      })),
    };
  }

  async processCSVImport(importId: string, data: ParsedTicket[], mapping: Record<string, string>) {
    await this.startImport(importId);

    const dataImport = await this.getImport(importId);
    if (!dataImport) throw new BadRequestException('Import not found');

    const options = (dataImport.options as ImportOptions) || {};
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      for (const row of data) {
        try {
          const parsed = this.parseCSVRow(row, mapping);
          await this.importTicket(dataImport.organizationId, parsed, options, dataImport.createdById);
          processed++;
        } catch (err) {
          failed++;
          errors.push(`Row ${processed + failed}: ${err.message}`);
        }

        if (processed % 50 === 0) {
          await this.prisma.dataImport.update({
            where: { id: importId },
            data: { processedRecords: processed, failedRecords: failed },
          });
        }
      }

      await this.prisma.dataImport.update({
        where: { id: importId },
        data: {
          status: 'COMPLETED',
          processedRecords: processed,
          failedRecords: failed,
          errorLog: errors.length > 0 ? errors.slice(0, 100).join('\n') : null,
          completedAt: new Date(),
        },
      });

      return { processed, failed, errors };
    } catch (err) {
      await this.prisma.dataImport.update({
        where: { id: importId },
        data: {
          status: 'FAILED',
          errorLog: err.message,
          completedAt: new Date(),
        },
      });
      throw err;
    }
  }

  parseCSVRow(row: any, mapping: Record<string, string>): ParsedTicket {
    return {
      subject: row[mapping.subject] || 'No Subject',
      description: row[mapping.description] || '',
      status: row[mapping.status] || 'OPEN',
      priority: row[mapping.priority] || 'NORMAL',
      type: row[mapping.type] || 'QUESTION',
      requesterEmail: row[mapping.requesterEmail],
      requesterName: row[mapping.requesterName],
      assigneeEmail: row[mapping.assigneeEmail],
      tags: row[mapping.tags] ? row[mapping.tags].split(',').map((t: string) => t.trim()) : [],
    };
  }

  async importTicket(organizationId: string, parsed: ParsedTicket, options: ImportOptions, userId: string) {
    let assigneeId: string | null = null;
    let creatorId = userId;

    if (parsed.assigneeEmail) {
      let assignee = await this.prisma.user.findFirst({
        where: { email: parsed.assigneeEmail, organizationId },
      });

      if (!assignee && options.createUsers) {
        assignee = await this.prisma.user.create({
          data: {
            email: parsed.assigneeEmail,
            name: parsed.assigneeEmail.split('@')[0],
            organizationId,
            role: 'AGENT',
          },
        });
      }

      if (assignee) assigneeId = assignee.id;
    }

    if (parsed.requesterEmail) {
      let requester = await this.prisma.user.findFirst({
        where: { email: parsed.requesterEmail, organizationId },
      });

      if (!requester && options.createUsers) {
        requester = await this.prisma.user.create({
          data: {
            email: parsed.requesterEmail,
            name: parsed.requesterName || parsed.requesterEmail.split('@')[0],
            organizationId,
            role: 'MEMBER',
          },
        });
      }

      if (requester) creatorId = requester.id;
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        subject: parsed.subject,
        description: parsed.description,
        status: (parsed.status || 'OPEN') as any,
        priority: (parsed.priority || 'NORMAL') as any,
        type: (parsed.type || 'QUESTION') as any,
        organizationId,
        creatorId,
        assigneeId,
        createdAt: parsed.createdAt,
        messages: parsed.messages && parsed.messages.length > 0 ? {
          create: await Promise.all(parsed.messages.map(async (msg) => {
            let authorId = userId;

            if (msg.authorEmail) {
              let author = await this.prisma.user.findFirst({
                where: { email: msg.authorEmail, organizationId },
              });

              if (!author && options.createUsers) {
                author = await this.prisma.user.create({
                  data: {
                    email: msg.authorEmail,
                    name: msg.authorName || msg.authorEmail.split('@')[0],
                    organizationId,
                    role: 'MEMBER',
                  },
                });
              }

              if (author) authorId = author.id;
            }

            return {
              content: msg.content,
              type: (msg.type || 'REPLY') as any,
              authorId,
              createdAt: msg.createdAt,
            };
          })),
        } : undefined,
      },
      include: { messages: true },
    });

    if (parsed.tags && parsed.tags.length > 0) {
      for (const tagName of parsed.tags) {
        let tag = await this.prisma.tag.findFirst({
          where: { name: tagName, organizationId },
        });

        if (!tag) {
          tag = await this.prisma.tag.create({
            data: { name: tagName, organizationId },
          });
        }

        await this.prisma.ticketTag.create({
          data: { ticketId: ticket.id, tagId: tag.id },
        }).catch(() => {});
      }
    }

    return ticket;
  }

  async cancelImport(importId: string) {
    const dataImport = await this.getImport(importId);
    if (!dataImport) {
      throw new BadRequestException('Import not found');
    }

    if (dataImport.status !== 'PROCESSING') {
      throw new BadRequestException('Can only cancel processing imports');
    }

    return this.prisma.dataImport.update({
      where: { id: importId },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
      },
    });
  }

  async deleteImport(importId: string) {
    await this.prisma.dataImport.delete({
      where: { id: importId },
    });

    return { success: true };
  }

  mapZendeskStatus(status: string): string {
    const mapping: Record<string, string> = {
      'new': 'OPEN',
      'open': 'IN_PROGRESS',
      'pending': 'WAITING_ON_CUSTOMER',
      'hold': 'WAITING_ON_CUSTOMER',
      'solved': 'RESOLVED',
      'closed': 'CLOSED',
    };
    return mapping[status?.toLowerCase()] || 'OPEN';
  }

  mapZendeskPriority(priority: string): string {
    const mapping: Record<string, string> = {
      'low': 'LOW',
      'normal': 'NORMAL',
      'high': 'HIGH',
      'urgent': 'URGENT',
    };
    return mapping[priority?.toLowerCase()] || 'NORMAL';
  }

  mapZendeskType(type: string): string {
    const mapping: Record<string, string> = {
      'question': 'QUESTION',
      'incident': 'INCIDENT',
      'problem': 'BUG',
      'task': 'TASK',
    };
    return mapping[type?.toLowerCase()] || 'QUESTION';
  }

  mapZammadState(state: string): string {
    const mapping: Record<string, string> = {
      'new': 'OPEN',
      'open': 'IN_PROGRESS',
      'pending reminder': 'WAITING_ON_CUSTOMER',
      'pending close': 'WAITING_ON_CUSTOMER',
      'closed': 'CLOSED',
    };
    return mapping[state?.toLowerCase()] || 'OPEN';
  }

  mapZammadPriority(priority: string): string {
    const mapping: Record<string, string> = {
      '1 low': 'LOW',
      '2 normal': 'NORMAL',
      '3 high': 'HIGH',
      'low': 'LOW',
      'normal': 'NORMAL',
      'high': 'HIGH',
    };
    return mapping[priority?.toLowerCase()] || 'NORMAL';
  }
}
