import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeEntriesService {
  constructor(private prisma: PrismaService) {}

  async findByTicket(ticketId: string) {
    return this.prisma.timeEntry.findMany({
      where: { ticketId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async findByUser(userId: string, organizationId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId, organizationId };
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    return this.prisma.timeEntry.findMany({
      where,
      include: {
        ticket: { select: { id: true, subject: true } },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async startTimer(ticketId: string, userId: string, organizationId: string, description?: string) {
    const activeTimer = await this.prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
    });

    if (activeTimer) {
      await this.stopTimer(activeTimer.id, userId);
    }

    return this.prisma.timeEntry.create({
      data: {
        ticketId,
        userId,
        organizationId,
        description,
        startTime: new Date(),
      },
    });
  }

  async stopTimer(entryId: string, userId: string) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id: entryId, userId },
    });
    if (!entry) throw new NotFoundException('Time entry not found');

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - entry.startTime.getTime()) / 1000);

    return this.prisma.timeEntry.update({
      where: { id: entryId },
      data: {
        endTime,
        duration,
      },
    });
  }

  async create(data: {
    ticketId: string;
    userId: string;
    organizationId: string;
    description?: string;
    startTime: Date;
    endTime?: Date;
    billable?: boolean;
  }) {
    const duration = data.endTime
      ? Math.floor((data.endTime.getTime() - data.startTime.getTime()) / 1000)
      : 0;

    return this.prisma.timeEntry.create({
      data: {
        ...data,
        duration,
      },
    });
  }

  async update(id: string, userId: string, organizationId: string, data: {
    description?: string;
    billable?: boolean;
    startTime?: Date;
    endTime?: Date;
  }) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id, userId, organizationId },
    });
    if (!entry) throw new NotFoundException('Time entry not found');

    const updateData: any = { ...data };
    if (data.startTime && data.endTime) {
      updateData.duration = Math.floor(
        (data.endTime.getTime() - data.startTime.getTime()) / 1000
      );
    }

    return this.prisma.timeEntry.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, userId: string, organizationId: string) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id, userId, organizationId },
    });
    if (!entry) throw new NotFoundException('Time entry not found');

    return this.prisma.timeEntry.delete({ where: { id } });
  }

  async getActiveTimer(userId: string) {
    return this.prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
      include: {
        ticket: { select: { id: true, subject: true } },
      },
    });
  }
}
