import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessageInput } from '@zapticket/shared';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async create(ticketId: string, authorId: string, data: MessageInput) {
    return this.prisma.message.create({
      data: {
        content: data.content,
        type: data.type,
        ticketId,
        authorId,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async findByTicket(ticketId: string) {
    return this.prisma.message.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        attachments: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
}
