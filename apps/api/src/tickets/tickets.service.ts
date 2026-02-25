import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async merge(primaryTicketId: string, mergeTicketId: string, userId: string) {
    if (primaryTicketId === mergeTicketId) {
      throw new BadRequestException('Cannot merge a ticket with itself');
    }

    const [primaryTicket, mergeTicket] = await Promise.all([
      this.prisma.ticket.findUnique({ where: { id: primaryTicketId } }),
      this.prisma.ticket.findUnique({ where: { id: mergeTicketId } }),
    ]);

    if (!primaryTicket || !mergeTicket) {
      throw new NotFoundException('One or both tickets not found');
    }

    if (primaryTicket.organizationId !== mergeTicket.organizationId) {
      throw new BadRequestException('Cannot merge tickets from different organizations');
    }

    const [messages, attachments] = await Promise.all([
      this.prisma.message.findMany({
        where: { ticketId: mergeTicketId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.attachment.findMany({
        where: { ticketId: mergeTicketId },
      }),
    ]);

    await this.prisma.$transaction([
      this.prisma.message.createMany({
        data: messages.map((msg) => ({
          ...msg,
          id: undefined,
          ticketId: primaryTicketId,
          createdAt: undefined,
          updatedAt: undefined,
        })),
      }),
      this.prisma.attachment.updateMany({
        where: { ticketId: mergeTicketId },
        data: { ticketId: primaryTicketId },
      }),
      this.prisma.ticketMerge.create({
        data: {
          primaryTicketId,
          mergedTicketId: mergeTicketId,
          reason: `Merged by user`,
        },
      }),
      this.prisma.ticket.update({
        where: { id: mergeTicketId },
        data: {
          status: 'CLOSED',
          mergedIntoId: primaryTicketId,
          isMerged: true,
        },
      }),
      this.prisma.activityLog.create({
        data: {
          type: 'MERGED',
          description: `Ticket ${mergeTicketId} merged into ${primaryTicketId}`,
          ticketId: primaryTicketId,
          userId,
          organizationId: primaryTicket.organizationId,
        },
      }),
    ]);

    return this.findOne(primaryTicketId);
  }

  async bulkUpdate(ticketIds: string[], data: UpdateTicketInput, userId: string, organizationId: string) {
    if (ticketIds.length === 0) {
      throw new BadRequestException('No tickets selected');
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.assigneeId) updateData.assigneeId = data.assigneeId;
    
    if (data.status === 'RESOLVED') updateData.resolvedAt = new Date();
    if (data.status === 'CLOSED') updateData.closedAt = new Date();

    await this.prisma.ticket.updateMany({
      where: { id: { in: ticketIds }, organizationId },
      data: updateData,
    });

    await this.prisma.activityLog.createMany({
      data: ticketIds.map((ticketId) => ({
        type: 'STATUS_CHANGED',
        description: `Bulk update: status set to ${data.status || 'N/A'}`,
        ticketId,
        userId,
        organizationId,
      })),
    });

    return { success: true, count: ticketIds.length };
  }
}
