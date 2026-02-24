import { Controller, Post, Body, UseGuards, Req, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterInput, LoginInput } from '@zapticket/shared';
import { AuthResponseDto, LoginDto, RegisterDto } from '../dtos/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private config: ConfigService
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getCurrentUser(@Req() req: any) {
    return req.user;
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input or email already exists' })
  register(@Body() data: RegisterInput) {
    return this.auth.register(data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() data: LoginInput) {
    return this.auth.login(data);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Tokens refreshed', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  refresh(@Body('refreshToken') token: string) {
    return this.auth.refresh(token);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  logout(@Req() req: any) {
    return this.auth.logout(req.user.sub);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth consent screen' })
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback endpoint' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const { accessToken, refreshToken, user } = req.user;
    const webUrl = this.config.get('WEB_URL') || 'http://localhost:3000';
    res.redirect(`${webUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${user.id}`);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth consent screen' })
  githubAuth() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  @ApiOperation({ summary: 'GitHub OAuth callback endpoint' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend with tokens' })
  async githubAuthCallback(@Req() req: any, @Res() res: Response) {
    const { accessToken, refreshToken, user } = req.user;
    const webUrl = this.config.get('WEB_URL') || 'http://localhost:3000';
    res.redirect(`${webUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${user.id}`);
  }
}
