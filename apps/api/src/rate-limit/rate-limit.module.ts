import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RateLimitMiddleware } from './rate-limit.middleware';

@Module({
  providers: [RateLimitMiddleware],
  exports: [RateLimitMiddleware],
})
export class RateLimitModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .exclude(
        '/api/v1/health',
        '/api/docs',
        '/api/(.*)/webhook'
      )
      .forRoutes('/api/*');
  }
}
