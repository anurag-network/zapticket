import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateSessionInput {
  visitorName?: string;
  visitorEmail?: string;
  visitorIp?: string;
  visitorUserAgent?: string;
  pageUrl?: string;
  pageTitle?: string;
}

interface SendMessageInput {
  sessionId: string;
  content: string;
  senderType: 'visitor' | 'agent';
  senderName?: string;
}

@Injectable()
export class LiveChatService {
  constructor(private prisma: PrismaService) {}

  async createSession(organizationId: string, input: CreateSessionInput) {
    return this.prisma.chatSession.create({
      data: {
        organizationId,
        visitorName: input.visitorName,
        visitorEmail: input.visitorEmail,
        visitorIp: input.visitorIp,
        visitorUserAgent: input.visitorUserAgent,
        pageUrl: input.pageUrl,
        pageTitle: input.pageTitle,
        status: 'QUEUED',
      },
    });
  }

  async getSession(sessionId: string) {
    return this.prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        agent: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async getQueuedSessions(organizationId: string) {
    return this.prisma.chatSession.findMany({
      where: {
        organizationId,
        status: 'QUEUED',
      },
      orderBy: { startedAt: 'asc' },
      include: {
        messages: { take: 1, orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async getActiveSessions(organizationId: string, agentId?: string) {
    const where: any = {
      organizationId,
      status: { in: ['ACTIVE', 'WAITING'] },
    };
    if (agentId) where.agentId = agentId;

    return this.prisma.chatSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
        agent: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async getEndedSessions(organizationId: string, limit: number = 50) {
    return this.prisma.chatSession.findMany({
      where: {
        organizationId,
        status: { in: ['ENDED', 'MISSED'] },
      },
      orderBy: { endedAt: 'desc' },
      take: limit,
      include: {
        agent: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async acceptSession(sessionId: string, agentId: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== 'QUEUED') {
      throw new Error('Session is no longer in queue');
    }

    const now = new Date();
    const waitTime = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'ACTIVE',
        agentId,
        waitTime,
      },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        agent: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
  }

  async sendMessage(input: SendMessageInput) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: input.sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status === 'ENDED' || session.status === 'MISSED') {
      throw new Error('Session has ended');
    }

    const message = await this.prisma.liveChatMessage.create({
      data: {
        sessionId: input.sessionId,
        content: input.content,
        senderType: input.senderType,
        senderName: input.senderName,
      },
    });

    if (session.status === 'WAITING' && input.senderType === 'agent') {
      await this.prisma.chatSession.update({
        where: { id: input.sessionId },
        data: { status: 'ACTIVE' },
      });
    } else if (input.senderType === 'visitor') {
      await this.prisma.chatSession.update({
        where: { id: input.sessionId },
        data: { status: 'WAITING' },
      });
    }

    return message;
  }

  async getMessages(sessionId: string, after?: string) {
    const where: any = { sessionId };
    if (after) {
      where.createdAt = { gt: new Date(after) };
    }

    return this.prisma.liveChatMessage.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }

  async endSession(sessionId: string, rating?: number, feedback?: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const now = new Date();
    const duration = session.startedAt
      ? Math.floor((now.getTime() - session.startedAt.getTime()) / 1000)
      : null;

    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'ENDED',
        endedAt: now,
        duration,
        rating,
        feedback,
      },
    });
  }

  async markMissed(sessionId: string) {
    return this.prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'MISSED',
        endedAt: new Date(),
      },
    });
  }

  async convertToTicket(sessionId: string, userId: string) {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const transcript = session.messages
      .map((m) => `[${new Date(m.createdAt).toLocaleString()}] ${m.senderName || m.senderType}: ${m.content}`)
      .join('\n\n');

    const ticket = await this.prisma.ticket.create({
      data: {
        subject: `Chat from ${session.visitorName || session.visitorEmail || 'Visitor'}`,
        description: `Chat Transcript:\n\n${transcript}`,
        status: 'OPEN',
        organizationId: session.organizationId,
        creatorId: userId,
        assigneeId: session.agentId,
      },
    });

    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { ticketId: ticket.id },
    });

    return ticket;
  }

  async getStats(organizationId: string) {
    const [total, active, queued, avgWaitTime, avgDuration, avgRating] = await Promise.all([
      this.prisma.chatSession.count({ where: { organizationId } }),
      this.prisma.chatSession.count({ where: { organizationId, status: { in: ['ACTIVE', 'WAITING'] } } }),
      this.prisma.chatSession.count({ where: { organizationId, status: 'QUEUED' } }),
      this.prisma.chatSession.aggregate({
        where: { organizationId, waitTime: { not: null } },
        _avg: { waitTime: true },
      }),
      this.prisma.chatSession.aggregate({
        where: { organizationId, duration: { not: null } },
        _avg: { duration: true },
      }),
      this.prisma.chatSession.aggregate({
        where: { organizationId, rating: { not: null } },
        _avg: { rating: true },
      }),
    ]);

    return {
      total,
      active,
      queued,
      avgWaitTime: avgWaitTime._avg.waitTime,
      avgDuration: avgDuration._avg.duration,
      avgRating: avgRating._avg.rating,
    };
  }
}
