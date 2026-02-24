import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { Role } from '@prisma/client';

interface CreateSSOConnectionInput {
  name: string;
  provider: string;
  domain: string;
  samlEntryPoint?: string;
  samlCertificate?: string;
  samlIssuer?: string;
  samlCallbackUrl?: string;
  oidcClientId?: string;
  oidcClientSecret?: string;
  oidcDiscoveryUrl?: string;
  oidcCallbackUrl?: string;
  emailAttribute?: string;
  nameAttribute?: string;
  autoProvision?: boolean;
  defaultRole?: Role;
}

@Injectable()
export class SSOService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async createConnection(organizationId: string, input: CreateSSOConnectionInput) {
    const existing = await this.prisma.sSOConnection.findUnique({
      where: {
        organizationId_domain: {
          organizationId,
          domain: input.domain,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('SSO connection for this domain already exists');
    }

    return this.prisma.sSOConnection.create({
      data: {
        organizationId,
        name: input.name,
        provider: input.provider as any,
        domain: input.domain,
        samlEntryPoint: input.samlEntryPoint,
        samlCertificate: input.samlCertificate,
        samlIssuer: input.samlIssuer,
        samlCallbackUrl: input.samlCallbackUrl,
        oidcClientId: input.oidcClientId,
        oidcClientSecret: input.oidcClientSecret,
        oidcDiscoveryUrl: input.oidcDiscoveryUrl,
        oidcCallbackUrl: input.oidcCallbackUrl,
        emailAttribute: input.emailAttribute || 'email',
        nameAttribute: input.nameAttribute || 'name',
        autoProvision: input.autoProvision ?? true,
        defaultRole: input.defaultRole,
      },
    });
  }

  async getConnections(organizationId: string) {
    return this.prisma.sSOConnection.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getConnection(connectionId: string) {
    return this.prisma.sSOConnection.findUnique({
      where: { id: connectionId },
    });
  }

  async getConnectionByDomain(domain: string) {
    return this.prisma.sSOConnection.findFirst({
      where: { domain, enabled: true },
      include: { organization: true },
    });
  }

  async updateConnection(connectionId: string, input: Partial<CreateSSOConnectionInput>) {
    return this.prisma.sSOConnection.update({
      where: { id: connectionId },
      data: {
        name: input.name,
        domain: input.domain,
        enabled: input.enabled as any,
        samlEntryPoint: input.samlEntryPoint,
        samlCertificate: input.samlCertificate,
        samlIssuer: input.samlIssuer,
        samlCallbackUrl: input.samlCallbackUrl,
        oidcClientId: input.oidcClientId,
        oidcClientSecret: input.oidcClientSecret,
        oidcDiscoveryUrl: input.oidcDiscoveryUrl,
        oidcCallbackUrl: input.oidcCallbackUrl,
        emailAttribute: input.emailAttribute,
        nameAttribute: input.nameAttribute,
        autoProvision: input.autoProvision,
        defaultRole: input.defaultRole,
      },
    });
  }

  async toggleConnection(connectionId: string, enabled: boolean) {
    return this.prisma.sSOConnection.update({
      where: { id: connectionId },
      data: { enabled },
    });
  }

  async deleteConnection(connectionId: string) {
    await this.prisma.sSOConnection.delete({
      where: { id: connectionId },
    });

    return { success: true };
  }

  async getOIDCAuthorizationUrl(connectionId: string) {
    const connection = await this.getConnection(connectionId);
    if (!connection) {
      throw new BadRequestException('SSO connection not found');
    }

    if (!connection.oidcClientId || !connection.oidcDiscoveryUrl) {
      throw new BadRequestException('OIDC configuration is incomplete');
    }

    const state = Buffer.from(JSON.stringify({
      connectionId,
      timestamp: Date.now(),
    })).toString('base64');

    const redirectUri = connection.oidcCallbackUrl || `${process.env.API_URL || 'http://localhost:3001'}/api/v1/sso/oidc/callback`;

    const params = new URLSearchParams({
      client_id: connection.oidcClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });

    const authUrl = `${connection.oidcDiscoveryUrl.replace('/.well-known/openid-configuration', '')}/authorize?${params}`;

    return { authorizationUrl: authUrl, state };
  }

  async handleOIDCCallback(code: string, state: string, ipAddress?: string, userAgent?: string) {
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const connection = await this.getConnection(stateData.connectionId);

    if (!connection) {
      throw new UnauthorizedException('Invalid SSO connection');
    }

    const redirectUri = connection.oidcCallbackUrl || `${process.env.API_URL}/sso/oidc/callback`;

    const tokenUrl = `${connection.oidcDiscoveryUrl.replace('/.well-known/openid-configuration', '')}/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: connection.oidcClientId!,
        client_secret: connection.oidcClientSecret!,
      }),
    });

    if (!tokenResponse.ok) {
      throw new UnauthorizedException('Failed to exchange OIDC token');
    }

    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;

    const payload = this.decodeJWT(idToken);
    const email = payload[connection.emailAttribute] || payload.email;
    const name = payload[connection.nameAttribute] || payload.name || email.split('@')[0];

    let user = await this.prisma.user.findFirst({
      where: { email, organizationId: connection.organizationId },
    });

    if (!user && connection.autoProvision) {
      user = await this.prisma.user.create({
        data: {
          email,
          name,
          role: connection.defaultRole || 'MEMBER',
          organizationId: connection.organizationId,
          emailVerified: new Date(),
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException('User not found and auto-provision is disabled');
    }

    await this.logLogin(connection.organizationId, user.id, connection.id, 'OIDC', payload.sub, email, true, ipAddress, userAgent);

    const tokens = await this.authService.generateTokensWithPayload(
      user.id,
      user.email,
      user.role,
      user.organizationId || undefined,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    };
  }

  async handleSAMLResponse(samlResponse: string, ipAddress?: string, userAgent?: string) {
    return { message: 'SAML handling not implemented yet. Use OIDC for now.' };
  }

  async logLogin(
    organizationId: string,
    userId: string | null,
    ssoConnectionId: string | null,
    ssoProvider: string,
    externalId: string,
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    errorMessage?: string,
    name?: string,
  ) {
    return this.prisma.sSOLogin.create({
      data: {
        organizationId,
        userId,
        ssoConnectionId,
        ssoProvider,
        externalId,
        email,
        name,
        success,
        ipAddress,
        userAgent,
        errorMessage,
      },
    });
  }

  async getLoginHistory(organizationId: string, limit: number = 50) {
    return this.prisma.sSOLogin.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        ssoConnection: { select: { id: true, name: true, provider: true } },
      },
    });
  }

  decodeJWT(token: string): any {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
    return JSON.parse(payload);
  }
}
