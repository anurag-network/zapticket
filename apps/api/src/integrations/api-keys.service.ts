import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.apiKey.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        key: false,
        permissions: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(organizationId: string, data: {
    name: string;
    permissions?: string[];
  }) {
    const key = `zt_${crypto.randomBytes(32).toString('hex')}`;
    
    return this.prisma.apiKey.create({
      data: {
        name: data.name,
        key,
        permissions: data.permissions || ['read'],
        organizationId,
      },
      select: {
        id: true,
        name: true,
        key: true,
        permissions: true,
        createdAt: true,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    await this.prisma.apiKey.delete({
      where: { id },
    });
    return { success: true };
  }

  async validate(key: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { key },
      include: { organization: true },
    });

    if (!apiKey) {
      return null;
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      id: apiKey.id,
      organizationId: apiKey.organizationId,
      permissions: apiKey.permissions,
      organization: apiKey.organization,
    };
  }
}
