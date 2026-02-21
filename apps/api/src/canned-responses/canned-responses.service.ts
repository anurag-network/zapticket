import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CannedResponseService {
  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    name: string,
    content: string,
    category?: string,
    shortcuts?: string[],
    variables?: Record<string, any>,
    createdById?: string
  ) {
    return this.prisma.cannedResponse.create({
      data: {
        organizationId,
        name,
        content,
        category,
        shortcuts: shortcuts || [],
        variables,
        createdById,
      },
    });
  }

  async update(
    id: string,
    updates: Partial<{
      name: string;
      content: string;
      category: string;
      shortcuts: string[];
      variables: Record<string, any>;
    }>
  ) {
    return this.prisma.cannedResponse.update({
      where: { id },
      data: updates,
    });
  }

  async delete(id: string) {
    await this.prisma.cannedResponse.delete({ where: { id } });
  }

  async get(organizationId: string, category?: string) {
    const where: any = { organizationId };
    if (category) {
      where.category = category;
    }
    return this.prisma.cannedResponse.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getById(id: string) {
    return this.prisma.cannedResponse.findUnique({ where: { id } });
  }

  async search(organizationId: string, query: string) {
    return this.prisma.cannedResponse.findMany({
      where: {
        organizationId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }

  async getByShortcut(organizationId: string, shortcut: string) {
    return this.prisma.cannedResponse.findFirst({
      where: {
        organizationId,
        shortcuts: { has: shortcut },
      },
    });
  }

  async incrementUsage(id: string) {
    await this.prisma.cannedResponse.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  async getCategories(organizationId: string) {
    const responses = await this.prisma.cannedResponse.findMany({
      where: { organizationId },
      select: { category: true },
      distinct: ['category'],
    });
    return responses.map((r) => r.category).filter(Boolean);
  }

  async processVariables(content: string, variables: Record<string, any>): string {
    let processed = content;
    
    const defaultVars = {
      customer_name: variables.customerName || 'Customer',
      customer_email: variables.customerEmail || '',
      agent_name: variables.agentName || 'Support Agent',
      ticket_id: variables.ticketId || '',
      ticket_subject: variables.ticketSubject || '',
      organization_name: variables.organizationName || '',
      current_date: new Date().toLocaleDateString(),
      current_time: new Date().toLocaleTimeString(),
    };

    const allVars = { ...defaultVars, ...variables };

    for (const [key, value] of Object.entries(allVars)) {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      processed = processed.replace(regex, String(value));
    }

    return processed;
  }
}
