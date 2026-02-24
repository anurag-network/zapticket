import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../common';
import { SSOService } from './sso.service';
import { Role } from '@prisma/client';

@ApiTags('SSO')
@Controller('sso')
export class SSOController {
  constructor(private ssoService: SSOService) {}

  @Get('connections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'List SSO connections for organization' })
  @ApiResponse({ status: 200, description: 'List of SSO connections' })
  getConnections(@Req() req: any) {
    return this.ssoService.getConnections(req.user.organizationId);
  }

  @Post('connections')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Create SSO connection' })
  @ApiResponse({ status: 201, description: 'SSO connection created' })
  createConnection(@Req() req: any, @Body() body: {
    name: string;
    provider: string;
    domain: string;
    samlEntryPoint?: string;
    samlCertificate?: string;
    samlIssuer?: string;
    oidcClientId?: string;
    oidcClientSecret?: string;
    oidcDiscoveryUrl?: string;
    oidcCallbackUrl?: string;
    emailAttribute?: string;
    nameAttribute?: string;
    autoProvision?: boolean;
    defaultRole?: Role;
  }) {
    return this.ssoService.createConnection(req.user.organizationId, body);
  }

  @Get('connections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get SSO connection details' })
  @ApiResponse({ status: 200, description: 'SSO connection details' })
  getConnection(@Param('id') connectionId: string) {
    return this.ssoService.getConnection(connectionId);
  }

  @Post('connections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Update SSO connection' })
  @ApiResponse({ status: 200, description: 'SSO connection updated' })
  updateConnection(
    @Param('id') connectionId: string,
    @Body() body: Partial<{
      name: string;
      domain: string;
      samlEntryPoint: string;
      samlCertificate: string;
      oidcClientId: string;
      oidcClientSecret: string;
      oidcDiscoveryUrl: string;
      autoProvision: boolean;
      defaultRole: Role;
    }>,
  ) {
    return this.ssoService.updateConnection(connectionId, body);
  }

  @Post('connections/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Enable or disable SSO connection' })
  @ApiResponse({ status: 200, description: 'SSO connection toggled' })
  toggleConnection(
    @Param('id') connectionId: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.ssoService.toggleConnection(connectionId, body.enabled);
  }

  @Delete('connections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Delete SSO connection' })
  @ApiResponse({ status: 200, description: 'SSO connection deleted' })
  deleteConnection(@Param('id') connectionId: string) {
    return this.ssoService.deleteConnection(connectionId);
  }

  @Get('connections/:id/authorize')
  @ApiOperation({ summary: 'Get OIDC authorization URL' })
  @ApiResponse({ status: 200, description: 'Authorization URL' })
  async getAuthorizationUrl(@Param('id') connectionId: string) {
    return this.ssoService.getOIDCAuthorizationUrl(connectionId);
  }

  @Get('login-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Get SSO login history' })
  @ApiResponse({ status: 200, description: 'Login history' })
  getLoginHistory(@Req() req: any, @Query('limit') limit?: string) {
    return this.ssoService.getLoginHistory(
      req.user.organizationId,
      limit ? parseInt(limit) : 50,
    );
  }
}

@Controller('sso/oidc')
export class OIDCController {
  constructor(private ssoService: SSOService) {}

  @Get('callback')
  @ApiOperation({ summary: 'OIDC callback endpoint' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const result = await this.ssoService.handleOIDCCallback(
        code,
        state,
        req.ip,
        req.headers['user-agent'],
      );

      const webUrl = process.env.WEB_URL || 'http://localhost:3000';
      res.redirect(
        `${webUrl}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}&userId=${result.user.id}`,
      );
    } catch (error) {
      const webUrl = process.env.WEB_URL || 'http://localhost:3000';
      res.redirect(`${webUrl}/login?error=sso_failed`);
    }
  }
}
