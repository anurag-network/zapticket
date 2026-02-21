import { Module } from '@nestjs/common';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';
import { CategoriesService } from './categories.service';
import { SearchService } from './search.service';

@Module({
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService, CategoriesService, SearchService],
  exports: [KnowledgeBaseService, SearchService],
})
export class KnowledgeBaseModule {}
