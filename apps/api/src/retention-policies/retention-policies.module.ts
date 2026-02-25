import { Module } from '@nestjs/common';
import { RetentionPoliciesController } from './retention-policies.controller';
import { RetentionPoliciesService } from './retention-policies.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RetentionPoliciesController],
  providers: [RetentionPoliciesService],
  exports: [RetentionPoliciesService],
})
export class RetentionPoliciesModule {}
