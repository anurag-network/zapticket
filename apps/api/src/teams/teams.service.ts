import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.team.findMany({
      where: { organizationId },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId },
      include: {
        members: {
          select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        },
      },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async create(organizationId: string, data: { name: string; description?: string }) {
    return this.prisma.team.create({
      data: {
        name: data.name,
        description: data.description,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: { name?: string; description?: string }) {
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId },
    });
    if (!team) throw new NotFoundException('Team not found');

    return this.prisma.team.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId },
    });
    if (!team) throw new NotFoundException('Team not found');

    await this.prisma.user.updateMany({
      where: { teamId: id },
      data: { teamId: null },
    });

    await this.prisma.team.delete({ where: { id } });
    return { success: true };
  }

  async addMember(teamId: string, userId: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
    });
    if (!team) throw new NotFoundException('Team not found');

    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });
    if (!user) throw new NotFoundException('User not found in organization');

    return this.prisma.user.update({
      where: { id: userId },
      data: { teamId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
  }

  async removeMember(teamId: string, userId: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
    });
    if (!team) throw new NotFoundException('Team not found');

    const user = await this.prisma.user.findFirst({
      where: { id: userId, teamId },
    });
    if (!user) throw new NotFoundException('User is not in this team');

    return this.prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
      select: { id: true, name: true, email: true },
    });
  }

  async getTeamMembers(teamId: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
    });
    if (!team) throw new NotFoundException('Team not found');

    return this.prisma.user.findMany({
      where: { teamId },
      select: { id: true, name: true, email: true, avatarUrl: true, role: true },
    });
  }
}
