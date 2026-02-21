import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EscalationService } from '../escalation/escalation.service';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private prisma: PrismaService,
    private escalation: EscalationService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleSlaBreaches() {
    this.logger.log('Checking for SLA breaches...');
    const result = await this.escalation.autoEscalateSlaBreaches();
    this.logger.log(`SLA check: ${result.checked} checked, ${result.escalated} escalated`);
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
