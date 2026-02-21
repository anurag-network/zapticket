import { Controller, Post, Body, UseGuards, Req, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterInput, LoginInput } from '@zapticket/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private config: ConfigService
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  register(@Body() data: RegisterInput) {
    return this.auth.register(data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  login(@Body() data: LoginInput) {
    return this.auth.login(data);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh tokens' })
  refresh(@Body('refreshToken') token: string) {
    return this.auth.refresh(token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  logout(@Req() req: any) {
    return this.auth.logout(req.user.sub);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth login' })
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const { accessToken, refreshToken, user } = req.user;
    const webUrl = this.config.get('WEB_URL') || 'http://localhost:3000';
    res.redirect(`${webUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${user.id}`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth login' })
  githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(@Req() req: any, @Res() res: Response) {
    const { accessToken, refreshToken, user } = req.user;
    const webUrl = this.config.get('WEB_URL') || 'http://localhost:3000';
    res.redirect(`${webUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${user.id}`);
  }
}
