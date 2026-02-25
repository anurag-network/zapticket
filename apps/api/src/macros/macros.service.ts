import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MacrosService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.macro.findMany({
      where: { organizationId, isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string, organizationId: string) {
    const macro = await this.prisma.macro.findFirst({
      where: { id, organizationId },
    });
    if (!macro) throw new NotFoundException('Macro not found');
    return macro;
  }

  async create(organizationId: string, data: {
    name: string;
    description?: string;
    content: string;
    category?: string;
    shortcuts?: string[];
  }) {
    return this.prisma.macro.create({
      data: {
        ...data,
        organizationId,
        category: data.category || 'General',
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    description?: string;
    content?: string;
    category?: string;
    shortcuts?: string[];
    isActive?: boolean;
  }) {
    const macro = await this.prisma.macro.findFirst({
      where: { id, organizationId },
    });
    if (!macro) throw new NotFoundException('Macro not found');

    return this.prisma.macro.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const macro = await this.prisma.macro.findFirst({
      where: { id, organizationId },
    });
    if (!macro) throw new NotFoundException('Macro not found');

    return this.prisma.macro.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async incrementUsage(id: string) {
    return this.prisma.macro.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }
}
