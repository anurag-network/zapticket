import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationInput } from '@zapticket/shared';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, data: CreateOrganizationInput) {
    return this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        members: { connect: { id: userId } },
      },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { settings: true },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async update(id: string, data: { name?: string; slug?: string }) {
    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.organization.findUnique({ where: { slug } });
  }
}
