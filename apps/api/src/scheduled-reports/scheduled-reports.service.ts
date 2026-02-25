import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduledReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.scheduledReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const report = await this.prisma.scheduledReport.findFirst({
      where: { id, organizationId },
    });
    if (!report) throw new NotFoundException('Scheduled report not found');
    return report;
  }

  async create(organizationId: string, data: {
    name: string;
    description?: string;
    type: string;
    frequency: string;
    recipients: string[];
    filters?: any;
    nextRunAt: Date;
  }) {
    return this.prisma.scheduledReport.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    description?: string;
    type?: string;
    frequency?: string;
    recipients?: string[];
    filters?: any;
    isActive?: boolean;
    nextRunAt?: Date;
  }) {
    const report = await this.prisma.scheduledReport.findFirst({
      where: { id, organizationId },
    });
    if (!report) throw new NotFoundException('Scheduled report not found');

    return this.prisma.scheduledReport.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const report = await this.prisma.scheduledReport.findFirst({
      where: { id, organizationId },
    });
    if (!report) throw new NotFoundException('Scheduled report not found');

    return this.prisma.scheduledReport.delete({ where: { id } });
  }

  async runReport(id: string, organizationId: string) {
    const report = await this.prisma.scheduledReport.findFirst({
      where: { id, organizationId },
    });
    if (!report) throw new NotFoundException('Scheduled report not found');

    await this.prisma.scheduledReport.update({
      where: { id },
      data: { lastRunAt: new Date() },
    });

    return { success: true, message: 'Report generated and sent' };
  }
}
