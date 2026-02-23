import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

interface CreateFollowUpInput {
  ticketId: string;
  createdById: string;
  type: string;
  remindAt: Date;
  note?: string;
  organizationId?: string;
}

interface CreateSnoozeInput {
  ticketId: string;
  snoozedById: string;
  snoozedUntil: Date;
  reason?: string;
}

@Injectable()
export class FollowUpsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async createFollowUp(input: CreateFollowUpInput) {
    const followUp = await this.prisma.ticketFollowUp.create({
      data: {
        ticketId: input.ticketId,
        createdById: input.createdById,
        type: input.type,
        remindAt: input.remindAt,
        note: input.note,
      },
      include: {
        ticket: { select: { id: true, subject: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return followUp;
  }

  async findByTicket(ticketId: string) {
    return this.prisma.ticketFollowUp.findMany({
      where: { ticketId },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { remindAt: 'asc' },
    });
  }

  async findPending(options?: { userId?: string; organizationId?: string }) {
    const where: any = {
      completedAt: null,
      remindAt: { lte: new Date() },
    };

    if (options?.userId) {
      where.createdById = options.userId;
    }

    if (options?.organizationId) {
      where.ticket = { organizationId: options.organizationId };
    }

    return this.prisma.ticketFollowUp.findMany({
      where,
      include: {
        ticket: {
          select: {
            id: true,
            subject: true,
            status: true,
            priority: true,
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { remindAt: 'asc' },
    });
  }

  async findUpcoming(options?: { userId?: string; hours?: number }) {
    const now = new Date();
    const endTime = new Date(now.getTime() + (options?.hours || 24) * 60 * 60 * 1000);

    const where: any = {
      completedAt: null,
      remindAt: {
        gte: now,
        lte: endTime,
      },
    };

    if (options?.userId) {
      where.createdById = options.userId;
    }

    return this.prisma.ticketFollowUp.findMany({
      where,
      include: {
        ticket: { select: { id: true, subject: true, status: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { remindAt: 'asc' },
    });
  }

  async completeFollowUp(followUpId: string, userId: string) {
    return this.prisma.ticketFollowUp.update({
      where: { id: followUpId },
      data: { completedAt: new Date() },
    });
  }

  async updateFollowUp(followUpId: string, data: { remindAt?: Date; note?: string; type?: string }) {
    return this.prisma.ticketFollowUp.update({
      where: { id: followUpId },
      data,
    });
  }

  async deleteFollowUp(followUpId: string) {
    await this.prisma.ticketFollowUp.delete({
      where: { id: followUpId },
    });

    return { success: true };
  }

  async snoozeTicket(input: CreateSnoozeInput) {
    const snooze = await this.prisma.ticketSnooze.create({
      data: {
        ticketId: input.ticketId,
        snoozedById: input.snoozedById,
        snoozedUntil: input.snoozedUntil,
        reason: input.reason,
      },
      include: {
        ticket: { select: { id: true, subject: true } },
        snoozedBy: { select: { id: true, name: true } },
      },
    });

    return snooze;
  }

  async findActiveSnoozes(options?: { organizationId?: string }) {
    const where: any = {
      unsnoozedAt: null,
      snoozedUntil: { gt: new Date() },
    };

    if (options?.organizationId) {
      where.ticket = { organizationId: options.organizationId };
    }

    return this.prisma.ticketSnooze.findMany({
      where,
      include: {
        ticket: { select: { id: true, subject: true, status: true } },
        snoozedBy: { select: { id: true, name: true } },
      },
      orderBy: { snoozedUntil: 'asc' },
    });
  }

  async findExpiredSnoozes() {
    return this.prisma.ticketSnooze.findMany({
      where: {
        unsnoozedAt: null,
        snoozedUntil: { lte: new Date() },
      },
      include: {
        ticket: { select: { id: true, subject: true } },
      },
    });
  }

  async unsnoozeTicket(snoozeId: string) {
    return this.prisma.ticketSnooze.update({
      where: { id: snoozeId },
      data: { unsnoozedAt: new Date() },
    });
  }

  async getTicketSnoozeHistory(ticketId: string) {
    return this.prisma.ticketSnooze.findMany({
      where: { ticketId },
      include: {
        snoozedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { snoozedAt: 'desc' },
    });
  }

  async processDueFollowUps() {
    const due = await this.findPending();

    for (const followUp of due) {
      await this.notificationService.create({
        userId: followUp.createdById,
        organizationId: followUp.ticket.organizationId,
        type: 'FOLLOW_UP_DUE',
        title: 'Follow-up Due',
        message: `Follow-up for ticket "${followUp.ticket.subject}" is due`,
        ticketId: followUp.ticketId,
        data: { followUpId: followUp.id },
      });
    }

    return { processed: due.length };
  }

  async processExpiredSnoozes() {
    const expired = await this.findExpiredSnoozes();

    for (const snooze of expired) {
      await this.unsnoozeTicket(snooze.id);

      await this.notificationService.create({
        userId: snooze.snoozedById,
        organizationId: snooze.ticket.organizationId,
        type: 'SNOOZE_EXPIRED',
        title: 'Snooze Expired',
        message: `Ticket "${snooze.ticket.subject}" is no longer snoozed`,
        ticketId: snooze.ticketId,
        data: { snoozeId: snooze.id },
      });
    }

    return { processed: expired.length };
  }
}
