import { Module } from '@nestjs/common';
import { AgentAvailabilityService } from './agent-availability.service';
import { AgentAvailabilityController } from './agent-availability.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgentAvailabilityController],
  providers: [AgentAvailabilityService],
  exports: [AgentAvailabilityService],
})
export class AgentAvailabilityModule {}
