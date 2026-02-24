import { Module } from '@nestjs/common';
import { SSOService } from './sso.service';
import { SSOController, OIDCController } from './sso.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SSOController, OIDCController],
  providers: [SSOService],
  exports: [SSOService],
})
export class SSOModule {}
