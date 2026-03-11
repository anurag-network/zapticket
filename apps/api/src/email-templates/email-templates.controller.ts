import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmailTemplatesService } from './email-templates.service';

@Controller('email-templates')
@UseGuards(JwtAuthGuard)
export class EmailTemplatesController {
  constructor(private emailTemplatesService: EmailTemplatesService) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.emailTemplatesService.findAll(req.user.organizationId);
  }

  @Get('defaults')
  async getDefaults() {
    return this.emailTemplatesService.getDefaultTemplates();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.emailTemplatesService.findOne(id, req.user.organizationId);
  }

  @Post()
  async create(
    @Request() req: any,
    @Body() data: { name: string; subject: string; body: string; type?: string },
  ) {
    return this.emailTemplatesService.create(req.user.organizationId, data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() data: { name?: string; subject?: string; body?: string; type?: string; active?: boolean },
  ) {
    return this.emailTemplatesService.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.emailTemplatesService.delete(id, req.user.organizationId);
  }

  @Post(':id/toggle')
  async toggleActive(@Param('id') id: string, @Request() req: any) {
    return this.emailTemplatesService.toggleActive(id, req.user.organizationId);
  }
}
