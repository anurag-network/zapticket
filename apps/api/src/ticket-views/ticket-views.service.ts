import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateViewInput {
  name: string;
  icon?: string;
  color?: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isShared?: boolean;
  columns?: { field: string; label?: string; visible?: boolean; width?: number; position?: number }[];
}

interface UpdateViewInput {
  name?: string;
  icon?: string;
  color?: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isShared?: boolean;
  position?: number;
}

@Injectable()
export class TicketViewsService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, createdById: string, input: CreateViewInput) {
    const { columns, ...viewData } = input;

    const view = await this.prisma.ticketView.create({
      data: {
        name: viewData.name,
        icon: viewData.icon,
        color: viewData.color,
        filters: viewData.filters as any,
        sortBy: viewData.sortBy,
        sortOrder: viewData.sortOrder || 'desc',
        isShared: viewData.isShared || false,
        organizationId,
        createdById,
        columns: columns
          ? {
              create: columns.map((col, idx) => ({
                field: col.field,
                label: col.label,
                visible: col.visible ?? true,
                width: col.width,
                position: col.position ?? idx,
              })),
            }
          : undefined,
      },
      include: {
        columns: { orderBy: { position: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return view;
  }

  async findByOrganization(organizationId: string, userId?: string) {
    return this.prisma.ticketView.findMany({
      where: {
        organizationId,
        OR: [{ isShared: true }, { createdById: userId }],
      },
      include: {
        columns: { orderBy: { position: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: [{ isDefault: 'desc' }, { position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findSharedViews(organizationId: string) {
    return this.prisma.ticketView.findMany({
      where: {
        organizationId,
        isShared: true,
      },
      include: {
        columns: { orderBy: { position: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { position: 'asc' },
    });
  }

  async findUserViews(organizationId: string, userId: string) {
    return this.prisma.ticketView.findMany({
      where: {
        organizationId,
        createdById: userId,
        isShared: false,
      },
      include: {
        columns: { orderBy: { position: 'asc' } },
      },
      orderBy: { position: 'asc' },
    });
  }

  async findOne(viewId: string) {
    return this.prisma.ticketView.findUnique({
      where: { id: viewId },
      include: {
        columns: { orderBy: { position: 'asc' } },
        createdBy: { select: { id: true, name: true } },
      },
    });
  }

  async update(viewId: string, input: UpdateViewInput) {
    return this.prisma.ticketView.update({
      where: { id: viewId },
      data: input,
      include: {
        columns: { orderBy: { position: 'asc' } },
      },
    });
  }

  async delete(viewId: string) {
    await this.prisma.ticketView.delete({
      where: { id: viewId },
    });

    return { success: true };
  }

  async setAsDefault(viewId: string, organizationId: string) {
    await this.prisma.ticketView.updateMany({
      where: { organizationId, isDefault: true },
      data: { isDefault: false },
    });

    return this.prisma.ticketView.update({
      where: { id: viewId },
      data: { isDefault: true },
    });
  }

  async updateColumns(viewId: string, columns: { id?: string; field: string; label?: string; visible?: boolean; width?: number; position?: number }[]) {
    await this.prisma.ticketViewColumn.deleteMany({
      where: { viewId },
    });

    const created = await this.prisma.ticketViewColumn.createMany({
      data: columns.map((col, idx) => ({
        viewId,
        field: col.field,
        label: col.label,
        visible: col.visible ?? true,
        width: col.width,
        position: col.position ?? idx,
      })),
    });

    return created;
  }

  async reorderViews(organizationId: string, viewIds: string[]) {
    const updates = viewIds.map((id, index) =>
      this.prisma.ticketView.update({
        where: { id },
        data: { position: index },
      }),
    );

    await Promise.all(updates);

    return { success: true };
  }

  async duplicate(viewId: string, userId: string) {
    const original = await this.findOne(viewId);
    if (!original) {
      throw new BadRequestException('View not found');
    }

    const { id, createdAt, updatedAt, columns, ...data } = original;

    return this.prisma.ticketView.create({
      data: {
        ...data,
        name: `${data.name} (Copy)`,
        isDefault: false,
        createdById: userId,
        columns: {
          create: columns.map((col) => ({
            field: col.field,
            label: col.label,
            visible: col.visible,
            width: col.width,
            position: col.position,
          })),
        },
      },
      include: {
        columns: { orderBy: { position: 'asc' } },
      },
    });
  }

  buildWhereClause(filters: Record<string, any>) {
    const where: any = {};

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status };
      } else {
        where.status = filters.status;
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        where.priority = { in: filters.priority };
      } else {
        where.priority = filters.priority;
      }
    }

    if (filters.type) {
      if (Array.isArray(filters.type)) {
        where.type = { in: filters.type };
      } else {
        where.type = filters.type;
      }
    }

    if (filters.assigneeId) {
      if (Array.isArray(filters.assigneeId)) {
        where.assigneeId = { in: filters.assigneeId };
      } else {
        where.assigneeId = filters.assigneeId;
      }
    }

    if (filters.teamId) {
      if (Array.isArray(filters.teamId)) {
        where.assignee = { teamId: { in: filters.teamId } };
      } else {
        where.assignee = { teamId: filters.teamId };
      }
    }

    if (filters.unassigned) {
      where.assigneeId = null;
    }

    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: { tagId: { in: filters.tags } },
      };
    }

    if (filters.createdAfter) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.createdAfter) };
    }

    if (filters.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.createdBefore) };
    }

    if (filters.dueBefore) {
      where.dueAt = { lte: new Date(filters.dueBefore) };
    }

    if (filters.isOverdue) {
      where.dueAt = { lt: new Date() };
      where.status = { notIn: ['RESOLVED', 'CLOSED'] };
    }

    if (filters.isEscalated) {
      where.escalatedAt = { not: null };
    }

    if (filters.excludeMerged) {
      where.isMerged = false;
    }

    return where;
  }

  async getTicketsForView(viewId: string, options?: { page?: number; limit?: number }) {
    const view = await this.findOne(viewId);
    if (!view) {
      throw new BadRequestException('View not found');
    }

    const where = this.buildWhereClause(view.filters as Record<string, any>);
    where.organizationId = view.organizationId;

    const page = options?.page || 1;
    const limit = options?.limit || 50;
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: view.sortBy ? { [view.sortBy]: view.sortOrder || 'desc' } : { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
          creator: { select: { id: true, name: true, email: true } },
          tags: { include: { tag: true } },
          customerProfile: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
