import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DocumentController } from '../controllers/document.controller';
import { HealthController } from '../controllers/health.controller';
import { ExtractionService } from '../services/extraction.service';
import { TextCleaningService } from '../services/text-cleaning.service';
import { LoggingService } from '../services/logging.service';
import { DocumentRepository } from '../repositories/document.repository';
import { ExtractionEngine } from '../extractors/extraction-engine';
import { PdfExtractor } from '../extractors/pdf-extractor';
import { DocxExtractor } from '../extractors/docx-extractor';
import { TxtExtractor } from '../extractors/txt-extractor';
import { AuthModule } from './auth.module';
import { AuthMiddleware } from '../middleware/auth.middleware';
import { Document } from '../entities/document.entity';
import { User } from '../entities/user.entity';
import { AuditLog } from '../entities/audit-log.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Document, User, AuditLog]),
    AuthModule,
  ],
  controllers: [DocumentController, HealthController],
  providers: [
    ExtractionService,
    TextCleaningService,
    LoggingService,
    DocumentRepository,
    ExtractionEngine,
    PdfExtractor,
    DocxExtractor,
    TxtExtractor,
  ],
  exports: [
    DocumentRepository,
    ExtractionService,
  ],
})
export class DocumentModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'api/documents/*', method: RequestMethod.ALL },
      );
  }
}