import { Module } from '@nestjs/common';
import { CustomerHealthService } from './customer-health.service';
import { CustomerHealthController } from './customer-health.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CustomerHealthController],
  providers: [CustomerHealthService],
  exports: [CustomerHealthService],
})
export class CustomerHealthModule {}
