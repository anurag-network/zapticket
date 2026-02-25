import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SlaPoliciesService } from './sla-policies.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('SLA Policies')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sla-policies')
export class SlaPoliciesController {
  constructor(private slaPolicies: SlaPoliciesService) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get all SLA policies' })
  findAll(@Req() req: any) {
    return this.slaPolicies.findAll(req.user.organizationId);
  }

  @Get('default')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get default SLA policy' })
  getDefault(@Req() req: any) {
    return this.slaPolicies.getDefault(req.user.organizationId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Get SLA policy by ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.slaPolicies.findOne(id, req.user.organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create a new SLA policy' })
  create(@Req() req: any, @Body() data: {
    name: string;
    description?: string;
    firstResponseTime: number;
    resolutionTime: number;
    priority: string;
    isDefault?: boolean;
    businessHours?: boolean;
    workStartTime?: string;
    workEndTime?: string;
    timezone?: string;
    notifyBefore?: number;
    notifyEscalation?: boolean;
  }) {
    return this.slaPolicies.create(req.user.organizationId, data);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update an SLA policy' })
  update(@Param('id') id: string, @Req() req: any, @Body() data: {
    name?: string;
    description?: string;
    firstResponseTime?: number;
    resolutionTime?: number;
    priority?: string;
    isDefault?: boolean;
    businessHours?: boolean;
    workStartTime?: string;
    workEndTime?: string;
    timezone?: string;
    notifyBefore?: number;
    notifyEscalation?: boolean;
    isActive?: boolean;
  }) {
    return this.slaPolicies.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete an SLA policy' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.slaPolicies.delete(id, req.user.organizationId);
  }
}
