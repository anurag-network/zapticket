import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IPWhitelistService } from './ip-whitelist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('IP Whitelist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ip-whitelist')
export class IPWhitelistController {
  constructor(private whitelist: IPWhitelistService) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get all IP whitelist entries' })
  findAll(@Req() req: any) {
    return this.whitelist.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get IP whitelist entry by ID' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.whitelist.findOne(id, req.user.organizationId);
  }

  @Post()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Add IP to whitelist' })
  create(@Req() req: any, @Body() data: {
    name: string;
    ipAddress: string;
    description?: string;
  }) {
    return this.whitelist.create(req.user.organizationId, data);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update IP whitelist entry' })
  update(@Param('id') id: string, @Req() req: any, @Body() data: {
    name?: string;
    ipAddress?: string;
    description?: string;
    isActive?: boolean;
  }) {
    return this.whitelist.update(id, req.user.organizationId, data);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Remove IP from whitelist' })
  delete(@Param('id') id: string, @Req() req: any) {
    return this.whitelist.delete(id, req.user.organizationId);
  }
}
