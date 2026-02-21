import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketInput, UpdateTicketInput, TicketFilters } from '@zapticket/shared';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, filters: TicketFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
        creator: { select: { id: true, name: true, email: true } },
        messages: {
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            attachments: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        tags: { include: { tag: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async create(organizationId: string, creatorId: string, data: TicketInput) {
    const ticket = await this.prisma.ticket.create({
      data: {
        subject: data.subject,
        description: data.description,
        priority: data.priority,
        organizationId,
        creatorId,
        tags: data.tags
          ? {
              connectOrCreate: data.tags.map((name) => ({
                where: { name },
                create: { name, organizationId },
              })),
            }
          : undefined,
      },
      include: { tags: { include: { tag: true } } },
    });
    return ticket;
  }

  async update(id: string, data: UpdateTicketInput) {
    return this.prisma.ticket.update({
      where: { id },
      data: {
        status: data.status,
        priority: data.priority,
        assigneeId: data.assigneeId,
        resolvedAt: data.status === 'RESOLVED' ? new Date() : undefined,
        closedAt: data.status === 'CLOSED' ? new Date() : undefined,
      },
    });
  }
}
