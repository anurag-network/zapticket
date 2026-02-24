import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateTimeEntryInput {
  ticketId: string;
  description?: string;
  billable?: boolean;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

interface UpdateTimeEntryInput {
  description?: string;
  billable?: boolean;
  endTime?: Date;
  duration?: number;
}

@Injectable()
export class TimeTrackingService {
  constructor(private prisma: PrismaService) {}

  async createEntry(organizationId: string, userId: string, input: CreateTimeEntryInput) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: input.ticketId, organizationId },
    });

    if (!ticket) {
      throw new BadRequestException('Ticket not found');
    }

    let duration = input.duration;
    if (input.startTime && input.endTime && !duration) {
      duration = Math.floor((input.endTime.getTime() - input.startTime.getTime()) / 1000);
    }

    return this.prisma.timeEntry.create({
      data: {
        organizationId,
        ticketId: input.ticketId,
        userId,
        description: input.description,
        billable: input.billable ?? true,
        startTime: input.startTime || new Date(),
        endTime: input.endTime,
        duration,
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        ticket: { select: { id: true, subject: true } },
      },
    });
  }

  async startTimer(organizationId: string, userId: string, ticketId: string, description?: string) {
    const existing = await this.prisma.timeEntry.findFirst({
      where: {
        userId,
        organizationId,
        endTime: null,
      },
    });

    if (existing) {
      throw new BadRequestException('You have an active timer. Stop it first.');
    }

    return this.prisma.timeEntry.create({
      data: {
        organizationId,
        ticketId,
        userId,
        description,
        startTime: new Date(),
        billable: true,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, subject: true } },
      },
    });
  }

  async stopTimer(entryId: string, userId: string, description?: string) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id: entryId, userId, endTime: null },
    });

    if (!entry) {
      throw new BadRequestException('Active timer not found');
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000);

    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        endTime,
        duration,
        description: description || entry.description,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, subject: true } },
      },
    });
  }

  async getActiveTimer(userId: string) {
    return this.prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
      include: {
        user: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, subject: true } },
      },
    });
  }

  async findByTicket(ticketId: string) {
    return this.prisma.timeEntry.findMany({
      where: { ticketId },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findByUser(userId: string, options?: { startDate?: Date; endDate?: Date }) {
    const where: any = { userId };
    if (options?.startDate) {
      where.startTime = { ...where.startTime, gte: options.startDate };
    }
    if (options?.endDate) {
      where.startTime = { ...where.startTime, lte: options.endDate };
    }

    return this.prisma.timeEntry.findMany({
      where,
      include: {
        ticket: { select: { id: true, subject: true, status: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findByOrganization(
    organizationId: string,
    options?: { startDate?: Date; endDate?: Date; userId?: string; billable?: boolean },
  ) {
    const where: any = { organizationId };
    if (options?.startDate) {
      where.startTime = { ...where.startTime, gte: options.startDate };
    }
    if (options?.endDate) {
      where.startTime = { ...where.startTime, lte: options.endDate };
    }
    if (options?.userId) {
      where.userId = options.userId;
    }
    if (options?.billable !== undefined) {
      where.billable = options.billable;
    }

    return this.prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, subject: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async updateEntry(entryId: string, userId: string, input: UpdateTimeEntryInput) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) {
      throw new BadRequestException('Time entry not found');
    }

    let duration = input.duration;
    if (entry.endTime && input.endTime && !duration) {
      duration = Math.floor((input.endTime.getTime() - entry.startTime.getTime()) / 1000);
    }

    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        description: input.description,
        billable: input.billable,
        endTime: input.endTime,
        duration,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, subject: true } },
      },
    });
  }

  async deleteEntry(entryId: string, userId: string) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id: entryId, userId },
    });

    if (!entry) {
      throw new BadRequestException('Time entry not found');
    }

    await this.prisma.timeEntry.delete({
      where: { id: entryId },
    });

    return { success: true };
  }

  async getTicketTimeSummary(ticketId: string) {
    const entries = await this.prisma.timeEntry.findMany({
      where: { ticketId },
    });

    const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const billableSeconds = entries
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    return {
      totalEntries: entries.length,
      totalSeconds,
      billableSeconds,
      totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
      billableHours: Math.round((billableSeconds / 3600) * 100) / 100,
    };
  }

  async getUserTimeSummary(userId: string, startDate: Date, endDate: Date) {
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: { gte: startDate, lte: endDate },
      },
    });

    const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const billableSeconds = entries
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    return {
      totalEntries: entries.length,
      totalSeconds,
      billableSeconds,
      totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
      billableHours: Math.round((billableSeconds / 3600) * 100) / 100,
    };
  }

  async getOrganizationTimeReport(
    organizationId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'user' | 'ticket' = 'user',
  ) {
    const entries = await this.prisma.timeEntry.findMany({
      where: {
        organizationId,
        startTime: { gte: startDate, lte: endDate },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, subject: true } },
      },
    });

    if (groupBy === 'user') {
      const byUser: Record<string, any> = {};
      for (const entry of entries) {
        const key = entry.userId;
        if (!byUser[key]) {
          byUser[key] = {
            user: entry.user,
            totalSeconds: 0,
            billableSeconds: 0,
            entries: [],
          };
        }
        byUser[key].totalSeconds += entry.duration || 0;
        if (entry.billable) {
          byUser[key].billableSeconds += entry.duration || 0;
        }
        byUser[key].entries.push(entry);
      }
      return Object.values(byUser).map((u: any) => ({
        ...u,
        totalHours: Math.round((u.totalSeconds / 3600) * 100) / 100,
        billableHours: Math.round((u.billableSeconds / 3600) * 100) / 100,
      }));
    } else {
      const byTicket: Record<string, any> = {};
      for (const entry of entries) {
        const key = entry.ticketId;
        if (!byTicket[key]) {
          byTicket[key] = {
            ticket: entry.ticket,
            totalSeconds: 0,
            billableSeconds: 0,
            entries: [],
          };
        }
        byTicket[key].totalSeconds += entry.duration || 0;
        if (entry.billable) {
          byTicket[key].billableSeconds += entry.duration || 0;
        }
        byTicket[key].entries.push(entry);
      }
      return Object.values(byTicket).map((t: any) => ({
        ...t,
        totalHours: Math.round((t.totalSeconds / 3600) * 100) / 100,
        billableHours: Math.round((t.billableSeconds / 3600) * 100) / 100,
      }));
    }
  }
}
