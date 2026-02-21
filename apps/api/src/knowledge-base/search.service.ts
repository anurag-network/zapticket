import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MeiliSearch from 'meilisearch';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  private client: MeiliSearch | null = null;
  private readonly indexName = 'articles';

  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {
    this.initClient();
  }

  private initClient() {
    const host = this.config.get('MEILI_HOST');
    const apiKey = this.config.get('MEILI_MASTER_KEY');

    if (!host) {
      console.log('Meilisearch not configured. Search disabled.');
      return;
    }

    this.client = new MeiliSearch({ host, apiKey });
    this.setupIndex();
  }

  private async setupIndex() {
    if (!this.client) return;

    try {
      const index = this.client.index(this.indexName);
      
      await index.updateSettings({
        searchableAttributes: ['title', 'content', 'excerpt', 'categoryName', 'tags'],
        filterableAttributes: ['organizationId', 'categoryId', 'published'],
        sortableAttributes: ['views', 'createdAt'],
        rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
      });
    } catch (error) {
      console.error('Failed to setup Meilisearch index:', error);
    }
  }

  async indexArticle(article: any) {
    if (!this.client) return;

    try {
      const index = this.client.index(this.indexName);
      await index.addDocuments([
        {
          id: article.id,
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          categoryName: article.category?.name,
          categoryId: article.categoryId,
          organizationId: article.organizationId,
          published: article.published,
          tags: article.tags?.map((t: any) => t.tag?.name).filter(Boolean) || [],
          views: article.views,
          createdAt: article.createdAt?.getTime() || Date.now(),
        },
      ]);
    } catch (error) {
      console.error('Failed to index article:', error);
    }
  }

  async removeArticle(id: string) {
    if (!this.client) return;

    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocument(id);
    } catch (error) {
      console.error('Failed to remove article from index:', error);
    }
  }

  async search(organizationId: string, query: string, options?: {
    limit?: number;
    categoryId?: string;
  }) {
    if (!this.client) {
      return { results: [], total: 0 };
    }

    try {
      const index = this.client.index(this.indexName);
      const filter: string[] = [`organizationId = "${organizationId}"`, 'published = true'];
      
      if (options?.categoryId) {
        filter.push(`categoryId = "${options.categoryId}"`);
      }

      const results = await index.search(query, {
        limit: options?.limit || 20,
        filter,
        attributesToRetrieve: ['id', 'title', 'excerpt', 'categoryName', 'categoryId', 'tags', 'views'],
        attributesToHighlight: ['title', 'excerpt'],
      });

      return {
        query,
        total: results.estimatedTotalHits || 0,
        processingTimeMs: results.processingTimeMs,
        results: results.hits.map((hit: any) => ({
          id: hit.id,
          title: hit._formatted?.title || hit.title,
          excerpt: hit._formatted?.excerpt || hit.excerpt,
          categoryName: hit.categoryName,
          categoryId: hit.categoryId,
          tags: hit.tags,
          score: hit._rankingScore,
        })),
      };
    } catch (error) {
      console.error('Search failed:', error);
      return { results: [], total: 0, error: 'Search failed' };
    }
  }

  async syncAllArticles(organizationId: string) {
    if (!this.client) return;

    const articles = await this.prisma.article.findMany({
      where: { organizationId },
      include: {
        category: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });

    const documents = articles.map((article) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      categoryName: article.category?.name,
      categoryId: article.categoryId,
      organizationId: article.organizationId,
      published: article.published,
      tags: article.tags.map((t) => t.tag.name),
      views: article.views,
      createdAt: article.createdAt.getTime(),
    }));

    const index = this.client.index(this.indexName);
    await index.addDocuments(documents);

    return { synced: documents.length };
  }
}
