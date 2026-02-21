import { Controller, Get, Post, Body, UseGuards, Req, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles, OrganizationGuard } from '../common';
import { CreateOrganizationInput } from '@zapticket/shared';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private orgs: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create organization' })
  create(@Req() req: any, @Body() data: CreateOrganizationInput) {
    return this.orgs.create(req.user.id, data);
  }

  @Get('current')
  @UseGuards(OrganizationGuard)
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Get current organization' })
  getCurrent(@Req() req: any) {
    return this.orgs.findOne(req.user.organizationId);
  }

  @Patch('current')
  @UseGuards(OrganizationGuard)
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update current organization' })
  updateCurrent(@Req() req: any, @Body() data: { name?: string; slug?: string }) {
    return this.orgs.update(req.user.organizationId, data);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string) {
    return this.orgs.findOne(id);
  }
}
