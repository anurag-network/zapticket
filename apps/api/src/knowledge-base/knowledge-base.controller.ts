import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CategoriesService } from './categories.service';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('knowledge-base')
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(
    private kb: KnowledgeBaseService,
    private categories: CategoriesService,
    private search: SearchService
  ) {}

  // Categories
  @Get('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all categories' })
  listCategories(@Req() req: any) {
    return this.categories.findAll(req.user.organizationId);
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category' })
  createCategory(
    @Req() req: any,
    @Body() data: { name: string; slug: string; description?: string; icon?: string; parentCategoryId?: string }
  ) {
    return this.categories.create(req.user.organizationId, data);
  }

  @Get('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get category with articles' })
  getCategory(@Param('id') id: string, @Req() req: any) {
    return this.categories.findOne(id, req.user.organizationId);
  }

  @Patch('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category' })
  updateCategory(
    @Param('id') id: string,
    @Req() req: any,
    @Body() data: { name?: string; slug?: string; description?: string; icon?: string; order?: number }
  ) {
    return this.categories.update(id, req.user.organizationId, data);
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category' })
  deleteCategory(@Param('id') id: string, @Req() req: any) {
    return this.categories.delete(id, req.user.organizationId);
  }

  // Articles
  @Get('articles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all articles' })
  listArticles(@Req() req: any, @Query('categoryId') categoryId?: string, @Query('published') published?: string) {
    return this.kb.findAll(req.user.organizationId, {
      categoryId,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
    });
  }

  @Post('articles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create article' })
  async createArticle(
    @Req() req: any,
    @Body() data: { title: string; slug: string; content: string; excerpt?: string; categoryId: string; published?: boolean; tags?: string[] }
  ) {
    const article = await this.kb.create(req.user.organizationId, req.user.id, data);
    await this.search.indexArticle(article);
    return article;
  }

  @Get('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get article details' })
  getArticle(@Param('id') id: string, @Req() req: any) {
    return this.kb.findOne(id, req.user.organizationId);
  }

  @Patch('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update article' })
  async updateArticle(
    @Param('id') id: string,
    @Req() req: any,
    @Body() data: { title?: string; slug?: string; content?: string; excerpt?: string; categoryId?: string; published?: boolean; order?: number; tags?: string[] }
  ) {
    const article = await this.kb.update(id, req.user.organizationId, data);
    await this.search.indexArticle(article);
    return article;
  }

  @Delete('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete article' })
  async deleteArticle(@Param('id') id: string, @Req() req: any) {
    const result = await this.kb.delete(id, req.user.organizationId);
    await this.search.removeArticle(id);
    return result;
  }

  @Get('popular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get popular articles' })
  getPopular(@Req() req: any, @Query('limit') limit?: string) {
    return this.kb.getPopular(req.user.organizationId, parseInt(limit || '10'));
  }

  // Search
  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search knowledge base' })
  searchKb(
    @Req() req: any,
    @Query('q') query: string,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string
  ) {
    return this.search.search(req.user.organizationId, query, {
      categoryId,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Post('search/sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync all articles to search index' })
  syncSearch(@Req() req: any) {
    return this.search.syncAllArticles(req.user.organizationId);
  }
}
