import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CannedResponseService } from './canned-responses.service';

@Controller('canned-responses')
@UseGuards(JwtAuthGuard)
export class CannedResponseController {
  constructor(private cannedResponseService: CannedResponseService) {}

  @Get()
  async list(@Request() req: any, @Query('category') category?: string) {
    return this.cannedResponseService.get(req.user.organizationId, category);
  }

  @Get('categories')
  async getCategories(@Request() req: any) {
    return this.cannedResponseService.getCategories(req.user.organizationId);
  }

  @Get('search')
  async search(@Request() req: any, @Query('q') query: string) {
    return this.cannedResponseService.search(req.user.organizationId, query);
  }

  @Get('shortcut/:shortcut')
  async getByShortcut(@Request() req: any, @Param('shortcut') shortcut: string) {
    return this.cannedResponseService.getByShortcut(req.user.organizationId, shortcut);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.cannedResponseService.getById(id);
  }

  @Post()
  async create(
    @Request() req: any,
    @Body() body: {
      name: string;
      content: string;
      category?: string;
      shortcuts?: string[];
      variables?: Record<string, any>;
    }
  ) {
    return this.cannedResponseService.create(
      req.user.organizationId,
      body.name,
      body.content,
      body.category,
      body.shortcuts,
      body.variables,
      req.user.id
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: Partial<{
      name: string;
      content: string;
      category: string;
      shortcuts: string[];
      variables: Record<string, any>;
    }>
  ) {
    return this.cannedResponseService.update(id, body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.cannedResponseService.delete(id);
    return { success: true };
  }

  @Post(':id/use')
  async recordUsage(@Param('id') id: string) {
    await this.cannedResponseService.incrementUsage(id);
    return { success: true };
  }

  @Post('process')
  async processVariables(
    @Body() body: { content: string; variables: Record<string, any> }
  ) {
    const processed = this.cannedResponseService.processVariables(
      body.content,
      body.variables
    );
    return { content: processed };
  }
}
