import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FormsService } from './forms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('forms')
@Controller('forms')
export class FormsController {
  constructor(private forms: FormsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all forms' })
  findAll(@Req() req: any) {
    return this.forms.findAll(req.user.organizationId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a form' })
  create(
    @Req() req: any,
    @Body() data: { name: string; description?: string; fields: any[] }
  ) {
    return this.forms.create(req.user.organizationId, data);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form details' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.forms.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update form' })
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() data: { name?: string; description?: string; fields?: any[]; active?: boolean }
  ) {
    return this.forms.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete form' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.forms.delete(id, req.user.organizationId);
  }

  @Get(':id/submissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get form submissions' })
  getSubmissions(@Param('id') id: string, @Req() req: any) {
    return this.forms.getSubmissions(id, req.user.organizationId);
  }

  @Post('submit/:slug')
  @ApiOperation({ summary: 'Submit a form (public)' })
  async submit(@Param('slug') slug: string, @Body() data: Record<string, any>) {
    return this.forms.submit(slug, data);
  }
}
