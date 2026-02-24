import { Module } from '@nestjs/common';
import { AISummarizationService } from './ai-summarization.service';
import { AICategorizationService } from './ai-categorization.service';
import { PredictiveCSATService } from './predictive-csat.service';
import { TranslationService } from './translation.service';
import { AISummarizationController } from './ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [AISummarizationController],
  providers: [
    AISummarizationService,
    AICategorizationService,
    PredictiveCSATService,
    TranslationService,
  ],
  exports: [
    AISummarizationService,
    AICategorizationService,
    PredictiveCSATService,
    TranslationService,
  ],
})
export class AIModule {}
