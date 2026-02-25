import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Two-Factor Authentication')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('two-factor')
export class TwoFactorController {
  constructor(private twoFactor: TwoFactorService) {}

  @Get('setup')
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  setup(@Req() req: any) {
    return this.twoFactor.generateSecret(req.user.id);
  }

  @Post('enable')
  @ApiOperation({ summary: 'Enable 2FA with verification code' })
  enable(@Req() req: any, @Body() body: { token: string }) {
    return this.twoFactor.verifyAndEnable(req.user.id, body.token);
  }

  @Post('disable')
  @ApiOperation({ summary: 'Disable 2FA with verification code' })
  disable(@Req() req: any, @Body() body: { token: string }) {
    return this.twoFactor.disable(req.user.id, body.token);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verify 2FA token' })
  verify(@Req() req: any, @Body() body: { token: string }) {
    return this.twoFactor.verify(req.user.id, body.token);
  }
}
