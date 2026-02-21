import { Module } from '@nestjs/common';
import { CSATService } from './csat.service';
import { CSATController } from './csat.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CSATController],
  providers: [CSATService],
  exports: [CSATService],
})
export class CSATModule {}
