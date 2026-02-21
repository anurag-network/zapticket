import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrganizationInput } from '@zapticket/shared';

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private orgs: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create organization' })
  create(@Req() req: any, @Body() data: CreateOrganizationInput) {
    return this.orgs.create(req.user.id, data);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current organization' })
  getCurrent(@Req() req: any) {
    return this.orgs.findOne(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string) {
    return this.orgs.findOne(id);
  }
}
