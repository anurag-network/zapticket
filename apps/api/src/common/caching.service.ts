import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class CachingService {
  private readonly logger = new Logger(CachingService.name);
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 300000;

  constructor(private configService: ConfigService) {
    setInterval(() => this.cleanup(), 60000);
  }

  async get<T>(key: string): Promise<T | null> {
    const redisUrl = this.configService.get('REDIS_URL');
    
    if (redisUrl) {
      try {
        const redis = await this.getRedis();
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        this.logger.warn(`Redis get failed: ${error.message}`);
      }
    }

    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    
    if (entry.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const redisUrl = this.configService.get('REDIS_URL');
    const expiresAt = Date.now() + (ttl || this.defaultTTL);

    if (redisUrl) {
      try {
        const redis = await this.getRedis();
        await redis.set(key, JSON.stringify(data), 'EX', (ttl || this.defaultTTL) / 1000);
        return;
      } catch (error) {
        this.logger.warn(`Redis set failed: ${error.message}`);
      }
    }

    this.memoryCache.set(key, { data, expiresAt });
  }

  async delete(key: string): Promise<void> {
    const redisUrl = this.configService.get('REDIS_URL');

    if (redisUrl) {
      try {
        const redis = await this.getRedis();
        await redis.del(key);
      } catch (error) {
        this.logger.warn(`Redis delete failed: ${error.message}`);
      }
    }

    this.memoryCache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const redisUrl = this.configService.get('REDIS_URL');

    if (redisUrl) {
      try {
        const redis = await this.getRedis();
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } catch (error) {
        this.logger.warn(`Redis invalidate failed: ${error.message}`);
      }
    }

    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.memoryCache.delete(key);
      }
    }
  }

  async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached) {
      return cached;
    }

    const data = await queryFn();
    await this.set(key, data, ttl);
    return data;
  }

  private async getRedis() {
    const Redis = require('ioredis');
    const redisUrl = this.configService.get('REDIS_URL');
    return new Redis(redisUrl);
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt < now) {
        this.memoryCache.delete(key);
      }
    }
  }
}
