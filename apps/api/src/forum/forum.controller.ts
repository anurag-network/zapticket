import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ForumService } from './forum.service';

@Controller('forum')
export class ForumController {
  constructor(private forumService: ForumService) {}

  @Get('categories')
  async getCategories(@Query('org') orgSlug?: string) {
    if (!orgSlug) return { categories: [] };
    
    const org = await import('../prisma/prisma.service').then(m => 
      m.PrismaService.prototype.organization?.findUnique({ where: { slug: orgSlug } })
    ).catch(() => null);
    
    if (!org) return { categories: [] };
    const categories = await this.forumService.getCategories(org.id);
    return { categories };
  }

  @Get('categories/:slug')
  async getCategory(@Param('slug') slug: string, @Query('org') orgSlug?: string) {
    if (!orgSlug) return null;
    const category = await this.forumService.getCategoryBySlug(slug, orgSlug);
    return category;
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard)
  async createCategory(
    @Request() req: any,
    @Body() body: { name: string; description?: string; icon?: string; color?: string },
  ) {
    return this.forumService.createCategory(req.user.organizationId, req.user.id, body);
  }

  @Get('threads/:slug')
  async getThread(@Param('slug') slug: string, @Query('org') orgSlug?: string) {
    if (!orgSlug) return null;
    return this.forumService.getThreadBySlug(slug, orgSlug);
  }

  @Post('threads')
  @UseGuards(JwtAuthGuard)
  async createThread(
    @Request() req: any,
    @Body() body: { categoryId: string; title: string; content: string },
  ) {
    return this.forumService.createThread(req.user.organizationId, req.user.id, body);
  }

  @Post('threads/:threadId/reply')
  @UseGuards(JwtAuthGuard)
  async replyToThread(
    @Param('threadId') threadId: string,
    @Request() req: any,
    @Body() body: { content: string },
  ) {
    return this.forumService.replyToThread(threadId, req.user.id, body.content);
  }

  @Post('threads/:threadId/vote')
  @UseGuards(JwtAuthGuard)
  async voteThread(
    @Param('threadId') threadId: string,
    @Request() req: any,
    @Body() body: { value: number },
  ) {
    return this.forumService.voteThread(threadId, req.user.id, body.value);
  }

  @Post('posts/:postId/vote')
  @UseGuards(JwtAuthGuard)
  async votePost(
    @Param('postId') postId: string,
    @Request() req: any,
    @Body() body: { value: number },
  ) {
    return this.forumService.votePost(postId, req.user.id, body.value);
  }

  @Post('posts/:postId/mark-answer')
  @UseGuards(JwtAuthGuard)
  async markAsAnswer(@Param('postId') postId: string) {
    return this.forumService.markAsAnswer(postId);
  }

  @Post('threads/:threadId/lock')
  @UseGuards(JwtAuthGuard)
  async lockThread(@Param('threadId') threadId: string) {
    return this.forumService.lockThread(threadId);
  }

  @Post('threads/:threadId/unlock')
  @UseGuards(JwtAuthGuard)
  async unlockThread(@Param('threadId') threadId: string) {
    return this.forumService.unlockThread(threadId);
  }

  @Post('threads/:threadId/pin')
  @UseGuards(JwtAuthGuard)
  async pinThread(@Param('threadId') threadId: string) {
    return this.forumService.pinThread(threadId);
  }

  @Post('threads/:threadId/unpin')
  @UseGuards(JwtAuthGuard)
  async unpinThread(@Param('threadId') threadId: string) {
    return this.forumService.unpinThread(threadId);
  }

  @Get('search')
  async search(@Query('q') query: string, @Query('org') orgSlug?: string) {
    if (!orgSlug || !query) return { threads: [] };
    const threads = await this.forumService.searchThreads(orgSlug, query);
    return { threads };
  }
}
