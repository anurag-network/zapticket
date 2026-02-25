import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlaPoliciesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.sLAPolicy.findMany({
      where: { organizationId },
      orderBy: { priority: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const policy = await this.prisma.sLAPolicy.findFirst({
      where: { id, organizationId },
    });
    if (!policy) throw new NotFoundException('SLA policy not found');
    return policy;
  }

  async getDefault(organizationId: string) {
    return this.prisma.sLAPolicy.findFirst({
      where: { organizationId, isDefault: true },
    });
  }

  async create(organizationId: string, data: {
    name: string;
    description?: string;
    firstResponseTime: number;
    resolutionTime: number;
    priority: string;
    businessHours?: boolean;
    workStartTime?: string;
    workEndTime?: string;
    timezone?: string;
    notifyBefore?: number;
    notifyEscalation?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.sLAPolicy.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.sLAPolicy.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    description?: string;
    firstResponseTime?: number;
    resolutionTime?: number;
    priority?: string;
    businessHours?: boolean;
    workStartTime?: string;
    workEndTime?: string;
    timezone?: string;
    notifyBefore?: number;
    notifyEscalation?: boolean;
    isActive?: boolean;
  }) {
    const policy = await this.prisma.sLAPolicy.findFirst({
      where: { id, organizationId },
    });
    if (!policy) throw new NotFoundException('SLA policy not found');

    if (data.isDefault && !policy.isDefault) {
      await this.prisma.sLAPolicy.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.sLAPolicy.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const policy = await this.prisma.sLAPolicy.findFirst({
      where: { id, organizationId },
    });
    if (!policy) throw new NotFoundException('SLA policy not found');

    if (policy.isDefault) {
      throw new BadRequestException('Cannot delete the default SLA policy');
    }

    return this.prisma.sLAPolicy.delete({ where: { id } });
  }

  async getPolicyForTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { priority: { include: { slaPolicy: true } } },
    });

    if (!ticket) return null;

    const defaultPolicy = await this.getDefault(ticket.organizationId);
    
    return defaultPolicy;
  }
}
