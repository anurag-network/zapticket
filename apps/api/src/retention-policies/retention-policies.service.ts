import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RetentionPoliciesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.retentionPolicy.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const policy = await this.prisma.retentionPolicy.findFirst({
      where: { id, organizationId },
    });
    if (!policy) throw new NotFoundException('Retention policy not found');
    return policy;
  }

  async create(organizationId: string, data: {
    name: string;
    description?: string;
    entityType: string;
    duration: number;
    action: string;
  }) {
    return this.prisma.retentionPolicy.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    description?: string;
    entityType?: string;
    duration?: number;
    action?: string;
    isActive?: boolean;
  }) {
    const policy = await this.prisma.retentionPolicy.findFirst({
      where: { id, organizationId },
    });
    if (!policy) throw new NotFoundException('Retention policy not found');

    return this.prisma.retentionPolicy.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const policy = await this.prisma.retentionPolicy.findFirst({
      where: { id, organizationId },
    });
    if (!policy) throw new NotFoundException('Retention policy not found');

    return this.prisma.retentionPolicy.delete({ where: { id } });
  }

  async executeRetention(organizationId: string) {
    const policies = await this.prisma.retentionPolicy.findMany({
      where: { organizationId, isActive: true },
    });

    for (const policy of policies) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.duration);

      if (policy.entityType === 'ticket' && policy.action === 'delete') {
        await this.prisma.ticket.deleteMany({
          where: {
            organizationId,
            status: 'CLOSED',
            closedAt: { lt: cutoffDate },
          },
        });
      }
    }

    return { success: true, message: 'Retention policies executed' };
  }
}
