import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityType } from '@prisma/client';

@Injectable()
export class ActivityLogService {
  constructor(private prisma: PrismaService) {}

  async log(
    ticketId: string,
    type: ActivityType,
    description: string,
    userId?: string,
    organizationId?: string,
    metadata?: Record<string, any>
  ) {
    return this.prisma.activityLog.create({
      data: {
        ticketId,
        type,
        description,
        userId,
        organizationId: organizationId || '',
        metadata,
      },
    });
  }

  async logTicketCreated(ticketId: string, userId: string, organizationId: string) {
    return this.log(
      ticketId,
      ActivityType.TICKET_CREATED,
      'Ticket was created',
      userId,
      organizationId
    );
  }

  async logStatusChange(
    ticketId: string,
    oldStatus: string,
    newStatus: string,
    userId: string,
    organizationId: string
  ) {
    return this.log(
      ticketId,
      ActivityType.STATUS_CHANGED,
      `Status changed from ${oldStatus} to ${newStatus}`,
      userId,
      organizationId,
      { oldStatus, newStatus }
    );
  }

  async logPriorityChange(
    ticketId: string,
    oldPriority: string,
    newPriority: string,
    userId: string,
    organizationId: string
  ) {
    return this.log(
      ticketId,
      ActivityType.PRIORITY_CHANGED,
      `Priority changed from ${oldPriority} to ${newPriority}`,
      userId,
      organizationId,
      { oldPriority, newPriority }
    );
  }

  async logAssignment(
    ticketId: string,
    assigneeName: string,
    userId: string,
    organizationId: string
  ) {
    return this.log(
      ticketId,
      ActivityType.ASSIGNED,
      `Ticket assigned to ${assigneeName}`,
      userId,
      organizationId,
      { assigneeName }
    );
  }

  async logUnassignment(ticketId: string, userId: string, organizationId: string) {
    return this.log(
      ticketId,
      ActivityType.UNASSIGNED,
      'Ticket unassigned',
      userId,
      organizationId
    );
  }

  async logTypeChange(
    ticketId: string,
    oldType: string,
    newType: string,
    userId: string,
    organizationId: string
  ) {
    return this.log(
      ticketId,
      ActivityType.TYPE_CHANGED,
      `Type changed from ${oldType} to ${newType}`,
      userId,
      organizationId,
      { oldType, newType }
    );
  }

  async logTagAdded(
    ticketId: string,
    tagName: string,
    userId: string,
    organizationId: string
  ) {
    return this.log(
      ticketId,
      ActivityType.TAG_ADDED,
      `Tag "${tagName}" added`,
      userId,
      organizationId,
      { tagName }
    );
  }

  async logTagRemoved(
    ticketId: string,
    tagName: string,
    userId: string,
    organizationId: string
  ) {
    return this.log(
      ticketId,
      ActivityType.TAG_REMOVED,
      `Tag "${tagName}" removed`,
      userId,
      organizationId,
      { tagName }
    );
  }

  async logMerge(
    ticketId: string,
    mergedTicketId: string,
    userId: string,
    organizationId: string
  ) {
    return this.log(
      ticketId,
      ActivityType.MERGED,
      `Ticket merged with #${mergedTicketId}`,
      userId,
      organizationId,
      { mergedTicketId }
    );
  }

  async logReply(ticketId: string, userId: string, organizationId: string, isInternal: boolean) {
    return this.log(
      ticketId,
      isInternal ? ActivityType.NOTE_ADDED : ActivityType.REPLY_ADDED,
      isInternal ? 'Internal note added' : 'Reply added',
      userId,
      organizationId
    );
  }

  async getTicketActivity(ticketId: string, limit: number = 50) {
    return this.prisma.activityLog.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async getOrganizationActivity(organizationId: string, limit: number = 100) {
    return this.prisma.activityLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        ticket: {
          select: { id: true, subject: true },
        },
      },
    });
  }
}
