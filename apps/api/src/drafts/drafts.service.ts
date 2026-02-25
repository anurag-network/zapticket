import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DraftsService {
  constructor(private prisma: PrismaService) {}

  async findByTicket(ticketId: string, userId: string) {
    return this.prisma.draft.findFirst({
      where: { ticketId, userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findAll(userId: string) {
    return this.prisma.draft.findMany({
      where: { userId },
      include: {
        ticket: { select: { id: true, subject: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    });
  }

  async upsert(ticketId: string, userId: string, content: string, isInternal: boolean = false) {
    const existing = await this.prisma.draft.findFirst({
      where: { ticketId, userId },
    });

    if (existing) {
      return this.prisma.draft.update({
        where: { id: existing.id },
        data: { content, isInternal },
      });
    }

    return this.prisma.draft.create({
      data: { ticketId, userId, content, isInternal },
    });
  }

  async delete(id: string, userId: string) {
    const draft = await this.prisma.draft.findFirst({
      where: { id, userId },
    });
    if (!draft) throw new NotFoundException('Draft not found');

    return this.prisma.draft.delete({ where: { id } });
  }

  async deleteByTicket(ticketId: string, userId: string) {
    return this.prisma.draft.deleteMany({
      where: { ticketId, userId },
    });
  }
}
