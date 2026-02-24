import { Module } from '@nestjs/common';
import { AISummarizationService } from './ai-summarization.service';
import { AISummarizationController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AISummarizationController],
  providers: [AISummarizationService],
  exports: [AISummarizationService],
})
export class AIModule {}
