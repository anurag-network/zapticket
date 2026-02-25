import { Module } from '@nestjs/common';
import { AssignmentRulesController } from './assignment-rules.controller';
import { AssignmentRulesService } from './assignment-rules.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AssignmentRulesController],
  providers: [AssignmentRulesService],
  exports: [AssignmentRulesService],
})
export class AssignmentRulesModule {}
