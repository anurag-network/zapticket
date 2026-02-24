import { Module } from '@nestjs/common';
import { Customer360Service } from './customer-360.service';
import { Customer360Controller } from './customer-360.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [Customer360Controller],
  providers: [Customer360Service],
  exports: [Customer360Service],
})
export class CustomersModule {}
