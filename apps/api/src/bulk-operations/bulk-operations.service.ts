import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityLogService } from '../activity-log/activity-log.service';

type BulkAction = 'update_status' | 'update_priority' | 'assign' | 'add_tag' | 'remove_tag' | 'close' | 'delete';

interface BulkOperationInput {
  ticketIds: string[];
  action: BulkAction;
  value?: any;
}

@Injectable()
export class BulkOperationsService {
  constructor(
    private prisma: PrismaService,
    private activityLog: ActivityLogService
  ) {}

  async executeBulkOperation(
    organizationId: string,
    userId: string,
    input: BulkOperationInput
  ) {
    const { ticketIds, action, value } = input;

    const tickets = await this.prisma.ticket.findMany({
      where: {
        id: { in: ticketIds },
        organizationId,
      },
    });

    if (tickets.length === 0) {
      return { success: false, message: 'No tickets found' };
    }

    const operation = await this.prisma.bulkOperation.create({
      data: {
        organizationId,
        createdById: userId,
        type: action,
        totalCount: tickets.length,
        status: 'running',
      },
    });

    let processedCount = 0;
    let failedCount = 0;
    const errors: any[] = [];

    for (const ticket of tickets) {
      try {
        await this.executeAction(ticket.id, action, value, userId, organizationId);
        processedCount++;
      } catch (error) {
        failedCount++;
        errors.push({ ticketId: ticket.id, error: error.message });
      }
    }

    await this.prisma.bulkOperation.update({
      where: { id: operation.id },
      data: {
        status: 'completed',
        processedCount,
        failedCount,
        errors: errors.length > 0 ? errors : null,
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      operationId: operation.id,
      totalCount: tickets.length,
      processedCount,
      failedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async executeAction(
    ticketId: string,
    action: BulkAction,
    value: any,
    userId: string,
    organizationId: string
  ) {
    switch (action) {
      case 'update_status':
        const oldTicket = await this.prisma.ticket.findUnique({
          where: { id: ticketId },
        });
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: value },
        });
        await this.activityLog.logStatusChange(
          ticketId,
          oldTicket?.status || 'OPEN',
          value,
          userId,
          organizationId
        );
        break;

      case 'update_priority':
        const oldPriority = await this.prisma.ticket.findUnique({
          where: { id: ticketId },
        });
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { priority: value },
        });
        await this.activityLog.logPriorityChange(
          ticketId,
          oldPriority?.priority || 'NORMAL',
          value,
          userId,
          organizationId
        );
        break;

      case 'assign':
        const assignee = await this.prisma.user.findUnique({
          where: { id: value },
        });
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { assigneeId: value },
        });
        await this.activityLog.logAssignment(
          ticketId,
          assignee?.name || assignee?.email || 'Unknown',
          userId,
          organizationId
        );
        break;

      case 'add_tag':
        await this.prisma.ticketTag.create({
          data: { ticketId, tagId: value },
        });
        const tag = await this.prisma.tag.findUnique({ where: { id: value } });
        await this.activityLog.logTagAdded(
          ticketId,
          tag?.name || 'Unknown',
          userId,
          organizationId
        );
        break;

      case 'remove_tag':
        await this.prisma.ticketTag.deleteMany({
          where: { ticketId, tagId: value },
        });
        const removedTag = await this.prisma.tag.findUnique({ where: { id: value } });
        await this.activityLog.logTagRemoved(
          ticketId,
          removedTag?.name || 'Unknown',
          userId,
          organizationId
        );
        break;

      case 'close':
        await this.prisma.ticket.update({
          where: { id: ticketId },
          data: { status: 'CLOSED', closedAt: new Date() },
        });
        await this.activityLog.log(
          ticketId,
          'CLOSED' as any,
          'Ticket closed',
          userId,
          organizationId
        );
        break;

      case 'delete':
        await this.prisma.ticket.delete({
          where: { id: ticketId },
        });
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  async getOperationStatus(operationId: string) {
    return this.prisma.bulkOperation.findUnique({
      where: { id: operationId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async getOrganizationOperations(organizationId: string, limit: number = 20) {
    return this.prisma.bulkOperation.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
