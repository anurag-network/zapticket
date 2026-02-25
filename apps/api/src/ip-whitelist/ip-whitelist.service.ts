import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IPWhitelistService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.iPWhitelist.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const entry = await this.prisma.iPWhitelist.findFirst({
      where: { id, organizationId },
    });
    if (!entry) throw new NotFoundException('IP whitelist entry not found');
    return entry;
  }

  async create(organizationId: string, data: {
    name: string;
    ipAddress: string;
    description?: string;
  }) {
    return this.prisma.iPWhitelist.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    ipAddress?: string;
    description?: string;
    isActive?: boolean;
  }) {
    const entry = await this.prisma.iPWhitelist.findFirst({
      where: { id, organizationId },
    });
    if (!entry) throw new NotFoundException('IP whitelist entry not found');

    return this.prisma.iPWhitelist.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const entry = await this.prisma.iPWhitelist.findFirst({
      where: { id, organizationId },
    });
    if (!entry) throw new NotFoundException('IP whitelist entry not found');

    return this.prisma.iPWhitelist.delete({ where: { id } });
  }

  async isAllowed(ip: string, organizationId: string): Promise<boolean> {
    const entries = await this.prisma.iPWhitelist.findMany({
      where: { organizationId, isActive: true },
    });

    if (entries.length === 0) return true;

    for (const entry of entries) {
      if (this.matchesIP(entry.ipAddress, ip)) {
        return true;
      }
    }

    return false;
  }

  private matchesIP(pattern: string, ip: string): boolean {
    if (pattern === ip) return true;
    
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return ip.startsWith(prefix);
    }
    
    if (pattern.includes('/')) {
      const [subnet, bits] = pattern.split('/');
      const mask = ~(2 ** (32 - parseInt(bits)) - 1);
      const subnetNum = this.ipToNumber(subnet);
      const ipNum = this.ipToNumber(ip);
      return (ipNum & mask) === (subnetNum & mask);
    }

    return false;
  }

  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  }
}
