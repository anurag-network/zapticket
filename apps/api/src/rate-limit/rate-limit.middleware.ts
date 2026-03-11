import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly limits = new Map<string, RateLimitEntry>();
  private readonly defaultLimit = 100;
  private readonly defaultWindowMs = 60000;

  private readonly endpoints: Record<string, { limit: number; windowMs: number }> = {
    '/api/v1/auth/login': { limit: 5, windowMs: 60000 },
    '/api/v1/auth/register': { limit: 3, windowMs: 60000 },
    '/api/v1/auth/refresh': { limit: 30, windowMs: 60000 },
    '/api/v1/tickets': { limit: 60, windowMs: 60000 },
    '/api/v1/channels/whatsapp/send': { limit: 20, windowMs: 60000 },
    '/api/v1/channels/sms/send': { limit: 20, windowMs: 60000 },
  };

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const path = req.path;
    
    const endpointConfig = this.findMatchingEndpoint(path);
    const limit = endpointConfig?.limit || this.defaultLimit;
    const windowMs = endpointConfig?.windowMs || this.defaultWindowMs;

    const key = `${ip}:${path}`;
    const now = Date.now();

    let entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      this.limits.set(key, entry);
    }

    entry.count++;

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    next();
  }

  private findMatchingEndpoint(path: string): { limit: number; windowMs: number } | null {
    for (const [endpoint] of Object.entries(this.endpoints)) {
      if (path.startsWith(endpoint)) {
        return this.endpoints[endpoint];
      }
    }
    return null;
  }
}
