import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MacrosService } from './macros.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('Macros')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('macros')
export class MacrosController {
  constructor(private macros: MacrosService) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get all macros' })
  findAll(@Req() req: any) {
    return this.macros.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get macro by ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.macros.findOne(id, req.user.organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a new macro' })
  create(@Req() req: any, @Body() data: {
    name: string;
    description?: string;
    content: string;
    category?: string;
    shortcuts?: string[];
  }) {
    return this.macros.create(req.user.organizationId, data);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update a macro' })
  update(@Param('id') id: string, @Req() req: any, @Body() data: {
    name?: string;
    description?: string;
    content?: string;
    category?: string;
    shortcuts?: string[];
    isActive?: boolean;
  }) {
    return this.macros.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete a macro' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.macros.delete(id, req.user.organizationId);
  }
}
