import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterInput, LoginInput } from '@zapticket/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService
  ) {}

  async register(data: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new UnauthorizedException('Email already registered');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.prisma.user.create({
      data: { email: data.email, passwordHash, name: data.name },
    });

    const tokens = await this.generateTokens(user.id);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async login(data: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refresh(token: string) {
    const stored = await this.prisma.refreshToken.findFirst({
      where: { token, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(stored.userId);
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async validateOAuthUser(profile: { email: string; name?: string; avatarUrl?: string }) {
    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
        },
      });
    } else if (!user.avatarUrl && profile.avatarUrl) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: profile.avatarUrl },
      });
    }

    const tokens = await this.generateTokens(user.id);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  private async generateTokens(userId: string) {
    return this.generateTokensWithPayload(userId);
  }

  async generateTokensWithPayload(userId: string, email?: string, role?: string, organizationId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const payload = {
      sub: userId,
      email: email || user.email,
      role: role || user.role,
      organizationId: organizationId || user.organizationId,
    };

    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign({ sub: userId, type: 'refresh' }, { expiresIn: '30d' });

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: { id: string; email: string; name: string | null; role: string }) {
    const { passwordHash, ...rest } = user as any;
    return rest;
  }
}
