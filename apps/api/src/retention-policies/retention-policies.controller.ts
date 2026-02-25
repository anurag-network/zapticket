import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RetentionPoliciesService } from './retention-policies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('Retention Policies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('retention-policies')
export class RetentionPoliciesController {
  constructor(private policies: RetentionPoliciesService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get all retention policies' })
  findAll(@Req() req: any) {
    return this.policies.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get retention policy by ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.policies.findOne(id, req.user.organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create retention policy' })
  create(@Req() req: any, @Body() data: {
    name: string;
    description?: string;
    entityType: string;
    duration: number;
    action: string;
  }) {
    return this.policies.create(req.user.organizationId, data);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update retention policy' })
  update(@Param('id') id: string, @Req() req: any, @Body() data: {
    name?: string;
    description?: string;
    entityType?: string;
    duration?: number;
    action?: string;
    isActive?: boolean;
  }) {
    return this.policies.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete retention policy' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.policies.delete(id, req.user.organizationId);
  }

  @Post('execute')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Execute retention policies' })
  execute(@Req() req: any) {
    return this.policies.executeRetention(req.user.organizationId);
  }
}
