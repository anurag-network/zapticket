import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

interface CreateMentionInput {
  mentionedUserId: string;
  mentionedById: string;
  ticketId: string;
  messageId: string;
  organizationId: string;
}

@Injectable()
export class MentionsService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async create(input: CreateMentionInput) {
    const mention = await this.prisma.mention.create({
      data: {
        mentionedUserId: input.mentionedUserId,
        mentionedById: input.mentionedById,
        ticketId: input.ticketId,
        messageId: input.messageId,
      },
      include: {
        mentionedUser: { select: { id: true, name: true, email: true } },
        mentionedBy: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, subject: true } },
        message: { select: { id: true, content: true } },
      },
    });

    await this.notificationService.notifyMention(
      input.mentionedUserId,
      input.organizationId,
      input.ticketId,
      mention.ticket.subject,
      mention.mentionedBy.name || mention.mentionedBy.email,
    );

    return mention;
  }

  async createMany(mentions: CreateMentionInput[]) {
    return Promise.all(mentions.map((m) => this.create(m)));
  }

  async findByTicket(ticketId: string) {
    return this.prisma.mention.findMany({
      where: { ticketId },
      include: {
        mentionedUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
        mentionedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        message: { select: { id: true, content: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByMessage(messageId: string) {
    return this.prisma.mention.findMany({
      where: { messageId },
      include: {
        mentionedUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
        mentionedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async findUserMentions(userId: string, options?: { unreadOnly?: boolean; limit?: number }) {
    const where: any = { mentionedUserId: userId };
    if (options?.unreadOnly) {
      where.read = false;
    }

    return this.prisma.mention.findMany({
      where,
      include: {
        mentionedBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        ticket: { select: { id: true, subject: true, status: true, priority: true } },
        message: { select: { id: true, content: true, createdAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.mention.count({
      where: {
        mentionedUserId: userId,
        read: false,
      },
    });
  }

  async markAsRead(mentionId: string, userId: string) {
    const mention = await this.prisma.mention.findFirst({
      where: {
        id: mentionId,
        mentionedUserId: userId,
      },
    });

    if (!mention) {
      return null;
    }

    return this.prisma.mention.update({
      where: { id: mentionId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.mention.updateMany({
      where: {
        mentionedUserId: userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  async delete(mentionId: string) {
    await this.prisma.mention.delete({
      where: { id: mentionId },
    });

    return { success: true };
  }

  extractMentionsFromContent(content: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const matches = content.match(mentionRegex) || [];
    return matches.map((m) => m.substring(1));
  }

  async resolveMentionsByEmails(emails: string[], organizationId: string) {
    return this.prisma.user.findMany({
      where: {
        email: { in: emails },
        organizationId,
      },
      select: { id: true, email: true, name: true },
    });
  }
}
