import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { AppConfig } from './config/app.config';
import { DatabaseConfig } from './config/database.config';
import { AuthModule } from './modules/auth.module';
import { DocumentModule } from './modules/document.module';
import { AuthMiddleware } from './middleware/auth.middleware';
import { RateLimitMiddleware } from './middleware/rate-limit.middleware';

@Module({
  imports: [
    AppConfig,
    DatabaseConfig,
    AuthModule,
    DocumentModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes(
        { path: 'api/auth/login', method: RequestMethod.POST },
      );

    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'api/auth/logout', method: RequestMethod.POST },
        { path: 'api/auth/session', method: RequestMethod.GET },
      );
  }
}