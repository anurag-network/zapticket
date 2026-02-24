import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: any;
  where?: any;
  include?: any;
  select?: any;
  cacheKey?: string;
  cacheTTL?: number;
}

@Injectable()
export class QueryOptimizationService {
  constructor(private prisma: PrismaService) {}

  async findMany<T>(
    model: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    const { limit = 50, offset = 0, orderBy = { createdAt: 'desc' }, ...queryOptions } = options;

    const query: any = {
      take: Math.min(limit, 100),
      skip: offset,
      orderBy,
      ...queryOptions,
    };

    return (this.prisma as any)[model].findMany(query);
  }

  async findFirst<T>(
    model: string,
    query: any
  ): Promise<T | null> {
    return (this.prisma as any)[model].findFirst(query);
  }

  async count(model: string, where: any): Promise<number> {
    return (this.prisma as any)[model].count({ where });
  }

  buildPaginationMeta(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }

  optimizeWhereClause(where: any, searchFields: string[], search?: string): any {
    if (!search) return where;

    return {
      ...where,
      OR: searchFields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      })),
    };
  }

  addDateFilter(where: any, dateField: string, period?: string): any {
    if (!period) return where;

    let startDate: Date;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return where;
    }

    return {
      ...where,
      [dateField]: { gte: startDate },
    };
  }
}
