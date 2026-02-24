import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface AuditAction {
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async log(
    organizationId: string,
    userId: string,
    action: AuditAction,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.prisma.activityLog.create({
        data: {
          organizationId,
          userId,
          action: action.action,
          entityType: action.resource,
          entityId: action.resourceId,
          details: action.details as any,
          metadata: {
            ipAddress,
            userAgent,
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  async getLogs(
    organizationId: string,
    options: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ): Promise<any[]> {
    const where: any = { organizationId };

    if (options.userId) where.userId = options.userId;
    if (options.action) where.action = options.action;
    if (options.resource) where.entityType = options.resource;
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    return this.prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async exportLogs(
    organizationId: string,
    options: {
      startDate: Date;
      endDate: Date;
      format?: 'json' | 'csv';
    },
  ): Promise<any> {
    const logs = await this.getLogs(organizationId, {
      startDate: options.startDate,
      endDate: options.endDate,
      limit: 10000,
    });

    if (options.format === 'csv') {
      const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Details'];
      const rows = logs.map(log => [
        log.createdAt.toISOString(),
        log.user?.name || log.user?.email || 'System',
        log.action,
        log.entityType,
        JSON.stringify(log.details || {}),
      ]);

      return {
        data: [headers, ...rows].map(row => row.join(',')).join('\n'),
        mimeType: 'text/csv',
      };
    }

    return { data: logs, mimeType: 'application/json' };
  }

  async getUserActivity(organizationId: string, userId: string, days: number = 30): Promise<any> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const logs = await this.prisma.activityLog.findMany({
      where: {
        organizationId,
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    const actionCounts: Record<string, number> = {};
    for (const log of logs) {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    }

    return {
      total: logs.length,
      actionCounts,
      recentActivity: logs.slice(0, 10),
    };
  }

  async getResourceHistory(organizationId: string, resourceType: string, resourceId: string): Promise<any[]> {
    return this.prisma.activityLog.findMany({
      where: {
        organizationId,
        entityType: resourceType,
        entityId: resourceId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async logLogin(organizationId: string, userId: string, method: string, ipAddress?: string): Promise<void> {
    await this.log(organizationId, userId, {
      action: 'USER_LOGIN',
      resource: 'auth',
      details: { method },
    }, ipAddress);
  }

  async logLogout(organizationId: string, userId: string): Promise<void> {
    await this.log(organizationId, userId, {
      action: 'USER_LOGOUT',
      resource: 'auth',
    });
  }

  async logTicketAction(
    organizationId: string,
    userId: string,
    ticketId: string,
    action: string,
    details?: any,
  ): Promise<void> {
    await this.log(organizationId, userId, {
      action,
      resource: 'ticket',
      resourceId: ticketId,
      details,
    });
  }

  async logSettingsChange(
    organizationId: string,
    userId: string,
    setting: string,
    oldValue: any,
    newValue: any,
  ): Promise<void> {
    await this.log(organizationId, userId, {
      action: 'SETTINGS_CHANGED',
      resource: 'settings',
      details: { setting, oldValue, newValue },
    });
  }
}
