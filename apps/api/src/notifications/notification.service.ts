import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateNotificationInput {
  userId: string;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  ticketId?: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        type: input.type,
        title: input.title,
        message: input.message,
        ticketId: input.ticketId,
        data: input.data as any,
      },
    });
  }

  async createForUsers(
    userIds: string[],
    organizationId: string,
    type: string,
    title: string,
    message: string,
    ticketId?: string,
    data?: Record<string, any>
  ) {
    const notifications = await Promise.all(
      userIds.map((userId) =>
        this.create({
          userId,
          organizationId,
          type,
          title,
          message,
          ticketId,
          data,
        })
      )
    );

    return notifications;
  }

  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  async getUserNotifications(userId: string, limit: number = 50, unreadOnly: boolean = false) {
    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        ticket: { select: { id: true, subject: true } },
      },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async deleteNotification(notificationId: string) {
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  async deleteAllRead(userId: string) {
    await this.prisma.notification.deleteMany({
      where: {
        userId,
        read: true,
      },
    });

    return { success: true };
  }

  async notifyTicketAssigned(
    assigneeId: string,
    organizationId: string,
    ticketId: string,
    ticketSubject: string
  ) {
    return this.create({
      userId: assigneeId,
      organizationId,
      type: 'TICKET_ASSIGNED',
      title: 'New Ticket Assigned',
      message: `You have been assigned to: ${ticketSubject}`,
      ticketId,
      data: { ticketId },
    });
  }

  async notifyTicketReplied(
    userId: string,
    organizationId: string,
    ticketId: string,
    ticketSubject: string,
    repliedBy: string
  ) {
    return this.create({
      userId,
      organizationId,
      type: 'TICKET_REPLIED',
      title: 'New Reply',
      message: `${repliedBy} replied to: ${ticketSubject}`,
      ticketId,
      data: { ticketId },
    });
  }

  async notifySLABreach(
    userId: string,
    organizationId: string,
    ticketId: string,
    ticketSubject: string,
    breachType: string
  ) {
    return this.create({
      userId,
      organizationId,
      type: 'SLA_BREACH',
      title: 'SLA Breach Warning',
      message: `${breachType} SLA breached for: ${ticketSubject}`,
      ticketId,
      data: { ticketId, breachType },
    });
  }

  async notifyMention(
    userId: string,
    organizationId: string,
    ticketId: string,
    ticketSubject: string,
    mentionedBy: string
  ) {
    return this.create({
      userId,
      organizationId,
      type: 'MENTION',
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you in: ${ticketSubject}`,
      ticketId,
      data: { ticketId },
    });
  }
}
