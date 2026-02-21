import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

@Injectable()
export class TicketMergeService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService
  ) {}

  async mergeTickets(
    primaryTicketId: string,
    ticketIdsToMerge: string[],
    userId: string,
    reason?: string
  ) {
    if (ticketIdsToMerge.includes(primaryTicketId)) {
      throw new BadRequestException('Cannot merge ticket into itself');
    }

    const primaryTicket = await this.prisma.ticket.findUnique({
      where: { id: primaryTicketId },
    });

    if (!primaryTicket) {
      throw new NotFoundException('Primary ticket not found');
    }

    if (primaryTicket.isMerged) {
      throw new BadRequestException('Primary ticket is already merged');
    }

    for (const ticketId of ticketIdsToMerge) {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${ticketId} not found`);
      }

      if (ticket.isMerged) {
        throw new BadRequestException(`Ticket ${ticketId} is already merged`);
      }

      if (ticket.organizationId !== primaryTicket.organizationId) {
        throw new BadRequestException('Cannot merge tickets from different organizations');
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const mergeRecords = [];

      for (const ticketId of ticketIdsToMerge) {
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            isMerged: true,
            mergedIntoId: primaryTicketId,
            status: 'CLOSED',
            closedAt: new Date(),
          },
        });

        await tx.message.updateMany({
          where: { ticketId },
          data: { ticketId: primaryTicketId },
        });

        const merge = await tx.ticketMerge.create({
          data: {
            primaryTicketId,
            mergedTicketId: ticketId,
            mergedById: userId,
            reason,
          },
        });
        mergeRecords.push(merge);

        await this.activityLog.log(
          primaryTicketId,
          'MERGED' as any,
          `Merged ticket #${ticketId} into this ticket`,
          userId,
          primaryTicket.organizationId,
          { mergedTicketId: ticketId }
        );

        await this.activityLog.log(
          ticketId,
          'MERGED' as any,
          `Merged into ticket #${primaryTicketId}`,
          userId,
          primaryTicket.organizationId,
          { primaryTicketId }
        );
      }

      return mergeRecords;
    });

    return {
      success: true,
      primaryTicketId,
      mergedCount: ticketIdsToMerge.length,
    };
  }

  async unmergeTicket(ticketId: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket || !ticket.isMerged) {
      throw new BadRequestException('Ticket is not merged');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          isMerged: false,
          mergedIntoId: null,
          status: 'OPEN',
          closedAt: null,
        },
      });

      await tx.ticketMerge.deleteMany({
        where: { mergedTicketId: ticketId },
      });
    });

    return { success: true };
  }

  async getMergeHistory(ticketId: string) {
    const mergedInto = await this.prisma.ticketMerge.findMany({
      where: { mergedTicketId: ticketId },
      include: {
        primaryTicket: { select: { id: true, subject: true } },
        mergedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const mergedFrom = await this.prisma.ticketMerge.findMany({
      where: { primaryTicketId: ticketId },
      include: {
        mergedTicket: { select: { id: true, subject: true } },
        mergedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return {
      mergedInto: mergedInto[0] || null,
      mergedFrom,
    };
  }

  async findPotentialDuplicates(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) return [];

    const keywords = ticket.subject
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5);

    const potentialDuplicates = await this.prisma.ticket.findMany({
      where: {
        organizationId: ticket.organizationId,
        id: { not: ticketId },
        isMerged: false,
        OR: [
          { subject: { contains: ticket.subject.substring(0, 20), mode: 'insensitive' } },
          ...keywords.map((k) => ({
            subject: { contains: k, mode: 'insensitive' as const },
          })),
        ],
      },
      take: 5,
      include: {
        creator: { select: { id: true, name: true, email: true } },
      },
    });

    return potentialDuplicates;
  }
}
