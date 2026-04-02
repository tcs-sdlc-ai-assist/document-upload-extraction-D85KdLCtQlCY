import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
  ConflictException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { DocumentRepository } from '../repositories/document.repository';
import { ExtractionService } from '../services/extraction.service';
import { LoggingService } from '../services/logging.service';
import { FileValidationPipe } from '../common/pipes/file-validation.pipe';
import { UploadResponseDto, DocumentStatusDto, DocumentResultDto, RetryResponseDto } from '../common/dto/document.dto';
import { ExtractionStatus } from '../entities/document.entity';
import * as crypto from 'crypto';

@Controller('api/documents')
export class DocumentController {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly extractionService: ExtractionService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile(new FileValidationPipe()) file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadResponseDto> {
    const userId = req.user.id;
    const ipAddress = this.extractIp(req);

    const fileHash = crypto
      .createHash('sha256')
      .update(file.buffer)
      .digest('hex');

    const fileType = this.normalizeFileType(file.mimetype);

    const document = await this.documentRepository.createDocument({
      userId,
      fileName: file.originalname,
      fileType,
      fileSize: file.size,
      fileHash,
    });

    await this.loggingService.logUploadEvent(
      document.id,
      userId,
      file.originalname,
      fileType,
      file.size,
      ipAddress,
    );

    this.extractionService
      .extract(document.id, file.buffer, fileType, userId)
      .catch((error) => {
        this.loggingService.logError('document-upload', error instanceof Error ? error : new Error(String(error)), {
          documentId: document.id,
          userId,
        });
      });

    return {
      documentId: document.id,
      status: ExtractionStatus.PROCESSING,
    };
  }

  @Get(':id/status')
  @HttpCode(HttpStatus.OK)
  async getStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentStatusDto> {
    const userId = req.user.id;

    const document = await this.documentRepository.findByIdAndUserId(id, userId);

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    let progress = 0;
    switch (document.extractionStatus) {
      case ExtractionStatus.PENDING:
        progress = 0;
        break;
      case ExtractionStatus.PROCESSING:
        progress = 50;
        break;
      case ExtractionStatus.COMPLETED:
        progress = 100;
        break;
      case ExtractionStatus.FAILED:
        progress = 0;
        break;
    }

    return {
      documentId: document.id,
      status: document.extractionStatus,
      progress,
      error: document.errorMessage || null,
    };
  }

  @Get(':id/result')
  @HttpCode(HttpStatus.OK)
  async getResult(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<DocumentResultDto> {
    const userId = req.user.id;

    const document = await this.documentRepository.findByIdAndUserId(id, userId);

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    if (document.extractionStatus === ExtractionStatus.FAILED) {
      throw new ConflictException('Extraction failed. Please retry.');
    }

    return {
      documentId: document.id,
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      extractedText: document.extractedText || null,
      status: document.extractionStatus,
    };
  }

  @Post(':id/retry')
  @HttpCode(HttpStatus.OK)
  async retryExtraction(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<RetryResponseDto> {
    const userId = req.user.id;

    const document = await this.documentRepository.findByIdAndUserId(id, userId);

    if (!document) {
      throw new NotFoundException('Document not found.');
    }

    if (document.extractionStatus !== ExtractionStatus.FAILED) {
      throw new ConflictException('Only failed extractions can be retried.');
    }

    this.extractionService
      .retry(document.id, userId)
      .catch((error) => {
        this.loggingService.logError('document-retry', error instanceof Error ? error : new Error(String(error)), {
          documentId: document.id,
          userId,
        });
      });

    return {
      documentId: document.id,
      status: ExtractionStatus.PROCESSING,
    };
  }

  private normalizeFileType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'text/plain': 'txt',
    };

    return mimeMap[mimeType] || mimeType;
  }

  private extractIp(req: AuthenticatedRequest): string {
    const forwarded = req.headers['x-forwarded-for'];

    if (forwarded) {
      const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      const ip = forwardedStr.split(',')[0].trim();
      if (ip.length > 0) {
        return ip;
      }
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}