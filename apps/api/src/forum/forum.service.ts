import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

interface ForumCategoryWithStats {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  threadCount: number;
  postCount: number;
}

@Injectable()
export class ForumService {
  private readonly logger = new Logger(ForumService.name);

  constructor(private prisma: PrismaService) {}

  async getCategories(organizationId: string): Promise<ForumCategoryWithStats[]> {
    const categories = await this.prisma.forumCategory.findMany({
      where: { organizationId, isPublic: true },
      orderBy: { order: 'asc' },
      include: {
        threads: { select: { id: true } },
      },
    });

    return categories.map(c => ({
      ...c,
      threadCount: c.threads.length,
      postCount: 0,
    }));
  }

  async getCategoryBySlug(slug: string, organizationId: string) {
    const category = await this.prisma.forumCategory.findFirst({
      where: { slug, organizationId },
      include: {
        threads: {
          where: { isLocked: false },
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          take: 50,
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            _count: { select: { posts: true, votes: true } },
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(organizationId: string, authorId: string, data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return this.prisma.forumCategory.create({
      data: {
        organizationId,
        name: data.name,
        slug: `${slug}-${Date.now()}`,
        description: data.description,
        icon: data.icon,
        color: data.color,
      },
    });
  }

  async getThreadBySlug(slug: string, organizationId: string) {
    const thread = await this.prisma.forumThread.findFirst({
      where: { slug, organizationId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        posts: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, avatarUrl: true } },
            votes: true,
          },
        },
        votes: true,
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    await this.prisma.forumThread.update({
      where: { id: thread.id },
      data: { views: { increment: 1 } },
    });

    return thread;
  }

  async createThread(organizationId: string, authorId: string, data: {
    categoryId: string;
    title: string;
    content: string;
  }) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return this.prisma.forumThread.create({
      data: {
        organizationId,
        authorId,
        categoryId: data.categoryId,
        title: data.title,
        slug: `${slug}-${Date.now()}`,
        content: data.content,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async replyToThread(threadId: string, authorId: string, content: string) {
    return this.prisma.forumPost.create({
      data: {
        threadId,
        authorId,
        content,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async voteThread(threadId: string, userId: string, value: number) {
    const existingVote = await this.prisma.forumVote.findFirst({
      where: { threadId, userId },
    });

    if (existingVote) {
      if (existingVote.value === value) {
        await this.prisma.forumVote.delete({ where: { id: existingVote.id } });
        return { action: 'removed' };
      }

      await this.prisma.forumVote.update({
        where: { id: existingVote.id },
        data: { value },
      });
      return { action: 'updated' };
    }

    await this.prisma.forumVote.create({
      data: {
        threadId,
        userId,
        value,
      },
    });
    return { action: 'created' };
  }

  async votePost(postId: string, userId: string, value: number) {
    const existingVote = await this.prisma.forumVote.findFirst({
      where: { postId, userId },
    });

    if (existingVote) {
      if (existingVote.value === value) {
        await this.prisma.forumVote.delete({ where: { id: existingVote.id } });
        return { action: 'removed' };
      }

      await this.prisma.forumVote.update({
        where: { id: existingVote.id },
        data: { value },
      });
      return { action: 'updated' };
    }

    await this.prisma.forumVote.create({
      data: {
        postId,
        userId,
        value,
      },
    });
    return { action: 'created' };
  }

  async markAsAnswer(postId: string) {
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
      include: { thread: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    await this.prisma.forumPost.updateMany({
      where: { threadId: post.threadId },
      data: { isAnswer: false },
    });

    await this.prisma.forumPost.update({
      where: { id: postId },
      data: { isAnswer: true },
    });

    await this.prisma.forumThread.update({
      where: { id: post.threadId },
      data: { isSolved: true },
    });

    return { success: true };
  }

  async lockThread(threadId: string) {
    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isLocked: true },
    });
  }

  async unlockThread(threadId: string) {
    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isLocked: false },
    });
  }

  async pinThread(threadId: string) {
    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isPinned: true },
    });
  }

  async unpinThread(threadId: string) {
    return this.prisma.forumThread.update({
      where: { id: threadId },
      data: { isPinned: false },
    });
  }

  async searchThreads(organizationId: string, query: string) {
    return this.prisma.forumThread.findMany({
      where: {
        organizationId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { name: true, slug: true } },
        _count: { select: { posts: true } },
      },
    });
  }
}
