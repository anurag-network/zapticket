import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get()
  @Roles('OWNER', 'ADMIN', 'AGENT')
  @ApiOperation({ summary: 'List organization users' })
  findAll(@Req() req: any) {
    return this.users.findAll(req.user.organizationId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Get user by ID' })
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'AGENT', 'MEMBER')
  @ApiOperation({ summary: 'Update user profile' })
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() data: { name?: string; avatarUrl?: string }
  ) {
    if (req.user.id !== id && req.user.role !== 'OWNER' && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.users.update(id, data);
  }

  @Patch(':id/role')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update user role' })
  async updateRole(
    @Param('id') id: string,
    @Req() req: any,
    @Body('role') role: string
  ) {
    return this.users.updateRole(id, req.user.organizationId, role, req.user.role);
  }

  @Delete(':id/organization')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Remove user from organization' })
  async removeFromOrganization(@Param('id') id: string, @Req() req: any) {
    return this.users.removeFromOrganization(id, req.user.organizationId);
  }
}
