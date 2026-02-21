import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterInput, LoginInput } from '@zapticket/shared';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

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
}
