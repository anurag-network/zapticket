import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChannelService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.channel.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, organizationId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return channel;
  }

  async create(organizationId: string, data: {
    type: string;
    name: string;
    config?: Record<string, any>;
  }) {
    return this.prisma.channel.create({
      data: {
        organizationId,
        type: data.type as any,
        name: data.name,
        config: data.config || {},
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    config?: Record<string, any>;
    active?: boolean;
  }) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, organizationId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return this.prisma.channel.update({
      where: { id },
      data: {
        name: data.name,
        config: data.config,
        active: data.active,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, organizationId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    await this.prisma.channel.delete({
      where: { id },
    });

    return { success: true };
  }

  async toggleActive(id: string, organizationId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, organizationId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return this.prisma.channel.update({
      where: { id },
      data: { active: !channel.active },
    });
  }

  async getConfig(id: string, organizationId: string) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, organizationId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const config = channel.config as Record<string, any>;
    const maskedConfig = { ...config };
    
    if (maskedConfig.accessToken) maskedConfig.accessToken = '••••••••';
    if (maskedConfig.apiKey) maskedConfig.apiKey = '••••••••';
    if (maskedConfig.apiSecret) maskedConfig.apiSecret = '••••••••';
    if (maskedConfig.authToken) maskedConfig.authToken = '••••••••';
    if (maskedConfig.secret) maskedConfig.secret = '••••••••';

    return maskedConfig;
  }

  async updateConfig(id: string, organizationId: string, config: Record<string, any>) {
    const channel = await this.prisma.channel.findFirst({
      where: { id, organizationId },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const existingConfig = (channel.config as Record<string, any>) || {};
    const mergedConfig = { ...existingConfig, ...config };

    return this.prisma.channel.update({
      where: { id },
      data: { config: mergedConfig },
    });
  }

  async getByType(organizationId: string, type: string) {
    return this.prisma.channel.findFirst({
      where: { organizationId, type: type as any },
    });
  }
}
