import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.category.findMany({
      where: { organizationId },
      include: {
        _count: { select: { articles: true, subCategories: true } },
        parentCategory: { select: { id: true, name: true } },
      },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(id: string, organizationId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, organizationId },
      include: {
        articles: {
          where: { published: true },
          select: { id: true, title: true, slug: true, excerpt: true, views: true },
          orderBy: { order: 'asc' },
        },
        subCategories: {
          select: { id: true, name: true, slug: true },
        },
        parentCategory: { select: { id: true, name: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async findBySlug(slug: string, organizationId?: string) {
    const where: any = { slug };
    if (organizationId) where.organizationId = organizationId;

    const category = await this.prisma.category.findFirst({
      where,
      include: {
        articles: {
          where: { published: true },
          select: { id: true, title: true, slug: true, excerpt: true },
        },
        subCategories: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(organizationId: string, data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    parentCategoryId?: string;
  }) {
    const maxOrder = await this.prisma.category.aggregate({
      where: { organizationId },
      _max: { order: true },
    });

    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        order: (maxOrder._max.order || 0) + 1,
        parentCategoryId: data.parentCategoryId,
        organizationId,
      },
    });
  }

  async update(id: string, organizationId: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    order?: number;
    parentCategoryId?: string | null;
  }) {
    const category = await this.prisma.category.findFirst({
      where: { id, organizationId },
    });
    if (!category) throw new NotFoundException('Category not found');

    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        order: data.order,
        parentCategoryId: data.parentCategoryId,
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, organizationId },
      include: { _count: { select: { articles: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');

    if (category._count.articles > 0) {
      throw new Error('Cannot delete category with articles. Move or delete articles first.');
    }

    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
