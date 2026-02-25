import { Module } from '@nestjs/common';
import { IPWhitelistController } from './ip-whitelist.controller';
import { IPWhitelistService } from './ip-whitelist.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IPWhitelistController],
  providers: [IPWhitelistService],
  exports: [IPWhitelistService],
})
export class IPWhitelistModule {}
