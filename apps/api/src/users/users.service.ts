import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.user.findMany({
      where: { organizationId },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, teamId: true, createdAt: true },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true, teamId: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, data: { name?: string; avatarUrl?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, avatarUrl: true },
    });
  }

  async updateRole(id: string, organizationId: string, newRole: string, requesterRole: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
    });

    if (!user) throw new NotFoundException('User not found in organization');

    if (user.role === 'OWNER') {
      throw new ForbiddenException('Cannot change owner role');
    }

    if (requesterRole !== 'OWNER' && newRole === 'OWNER') {
      throw new ForbiddenException('Only owners can assign owner role');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: newRole as any },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true },
    });
  }

  async addToOrganization(userId: string, organizationId: string, role: string = 'MEMBER') {
    return this.prisma.user.update({
      where: { id: userId },
      data: { organizationId, role: role as any },
      select: { id: true, email: true, name: true, role: true, avatarUrl: true },
    });
  }

  async removeFromOrganization(userId: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) throw new NotFoundException('User not found in organization');

    if (user.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove owner from organization');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { organizationId: null, teamId: null, role: 'MEMBER' },
      select: { id: true, email: true, name: true },
    });
  }
}
