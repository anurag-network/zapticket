import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { WebhooksService } from '../integrations/webhooks.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private prisma: PrismaService,
    private workflows: WorkflowsService,
    private webhooks: WebhooksService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSlaBreaches() {
    this.logger.log('Checking for SLA breaches...');

    const slaThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const breachedTickets = await this.prisma.ticket.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        createdAt: { lt: slaThreshold },
      },
      include: { organization: true },
    });

    for (const ticket of breachedTickets) {
      await this.webhooks.trigger('ticket.sla_breach', ticket.organizationId, {
        ticketId: ticket.id,
        subject: ticket.subject,
        createdAt: ticket.createdAt,
        organizationId: ticket.organizationId,
      });
    }

    this.logger.log(`Found ${breachedTickets.length} SLA breaches`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleStaleTickets() {
    this.logger.log('Checking for stale tickets...');

    const staleThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const staleTickets = await this.prisma.ticket.updateMany({
      where: {
        status: 'WAITING_ON_CUSTOMER',
        updatedAt: { lt: staleThreshold },
      },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    this.logger.log(`Closed ${staleTickets.count} stale tickets`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async generateDailyReports() {
    this.logger.log('Generating daily reports...');
  }

  @Cron(CronExpression.EVERY_WEEK_ON_MONDAY_AT_3AM)
  async generateWeeklyReports() {
    this.logger.log('Generating weekly reports...');
  }
}
