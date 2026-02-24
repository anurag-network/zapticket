import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsService } from './permissions.service';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(private permissionsService: PermissionsService) {}

  @Get('roles')
  async getAllRoles(@Request() req: any) {
    return this.permissionsService.getAllRoles(req.user.organizationId);
  }

  @Post('roles')
  async createRole(
    @Request() req: any,
    @Body() body: {
      name: string;
      description?: string;
      permissions: { resource: string; actions: string[] }[];
    },
  ) {
    return this.permissionsService.createCustomRole(req.user.organizationId, body);
  }

  @Put('roles/:roleId')
  async updateRole(
    @Request() req: any,
    @Param('roleId') roleId: string,
    @Body() body: {
      name?: string;
      description?: string;
      permissions?: { resource: string; actions: string[] }[];
    },
  ) {
    return this.permissionsService.updateCustomRole(req.user.organizationId, roleId, body);
  }

  @Delete('roles/:roleId')
  async deleteRole(
    @Request() req: any,
    @Param('roleId') roleId: string,
  ) {
    return this.permissionsService.deleteCustomRole(req.user.organizationId, roleId);
  }

  @Get('check/:resource/:action')
  async checkPermission(
    @Request() req: any,
    @Param('resource') resource: string,
    @Param('action') action: string,
  ) {
    const hasPermission = await this.permissionsService.checkPermission(
      req.user.id,
      resource,
      action,
    );
    return { hasPermission };
  }
}
