import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnowledgeBaseService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, filters?: { categoryId?: string; published?: boolean }) {
    const where: any = { organizationId };
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.published !== undefined) where.published = filters.published;

    return this.prisma.article.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        author: { select: { id: true, name: true } },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, organizationId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id, organizationId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  async findBySlug(slug: string, organizationId?: string) {
    const where: any = { slug, published: true };
    if (organizationId) where.organizationId = organizationId;

    const article = await this.prisma.article.findFirst({
      where,
      include: {
        category: { select: { id: true, name: true } },
        tags: { include: { tag: { select: { id: true, name: true } } } },
        author: { select: { id: true, name: true } },
      },
    });
    if (!article) throw new NotFoundException('Article not found');

    await this.prisma.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    });

    return article;
  }

  async create(organizationId: string, authorId: string, data: {
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    categoryId: string;
    published?: boolean;
    tags?: string[];
  }) {
    const article = await this.prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        published: data.published ?? false,
        categoryId: data.categoryId,
        authorId,
        organizationId,
        tags: data.tags
          ? {
              connectOrCreate: data.tags.map((name) => ({
                where: { name_organizationId: { name, organizationId } },
                create: { name, organizationId },
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    return article;
  }

  async update(id: string, organizationId: string, data: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    categoryId?: string;
    published?: boolean;
    order?: number;
    tags?: string[];
  }) {
    const article = await this.prisma.article.findFirst({
      where: { id, organizationId },
    });
    if (!article) throw new NotFoundException('Article not found');

    return this.prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt,
        published: data.published,
        order: data.order,
        categoryId: data.categoryId,
        tags: data.tags
          ? {
              deleteMany: {},
              connectOrCreate: data.tags.map((name) => ({
                where: { name_organizationId: { name, organizationId } },
                create: { name, organizationId },
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });
  }

  async delete(id: string, organizationId: string) {
    const article = await this.prisma.article.findFirst({
      where: { id, organizationId },
    });
    if (!article) throw new NotFoundException('Article not found');

    await this.prisma.article.delete({ where: { id } });
    return { success: true };
  }

  async getPopular(organizationId: string, limit: number = 10) {
    return this.prisma.article.findMany({
      where: { organizationId, published: true },
      orderBy: { views: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        views: true,
        category: { select: { id: true, name: true } },
      },
    });
  }
}
