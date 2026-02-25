import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssignmentRulesService } from './assignment-rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('Assignment Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignment-rules')
export class AssignmentRulesController {
  constructor(private rules: AssignmentRulesService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get all assignment rules' })
  findAll(@Req() req: any) {
    return this.rules.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get assignment rule by ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.rules.findOne(id, req.user.organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create assignment rule' })
  create(@Req() req: any, @Body() data: {
    name: string;
    description?: string;
    conditions: any;
    actions: any;
    teamId?: string;
  }) {
    return this.rules.create(req.user.organizationId, data);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update assignment rule' })
  update(@Param('id') id: string, @Req() req: any, @Body() data: {
    name?: string;
    description?: string;
    conditions?: any;
    actions?: any;
    teamId?: string;
    isActive?: boolean;
  }) {
    return this.rules.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete assignment rule' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.rules.delete(id, req.user.organizationId);
  }
}
