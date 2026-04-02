import { Injectable } from '@nestjs/common';
import { DocumentRepository } from '../repositories/document.repository';
import { ExtractionEngine } from '../extractors/extraction-engine';
import { TextCleaningService } from './text-cleaning.service';
import { LoggingService } from './logging.service';
import { ExtractionStatus } from '../entities/document.entity';

@Injectable()
export class ExtractionService {
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly extractionEngine: ExtractionEngine,
    private readonly textCleaningService: TextCleaningService,
    private readonly loggingService: LoggingService,
  ) {}

  async extract(
    documentId: string,
    fileBuffer: Buffer,
    fileType: string,
    userId: string,
  ): Promise<void> {
    await this.documentRepository.updateStatus(documentId, ExtractionStatus.PROCESSING);

    try {
      if (!this.extractionEngine.isSupportedType(fileType)) {
        throw new Error(
          `Unsupported file type: ${fileType}. Only PDF, DOCX, and TXT are allowed.`,
        );
      }

      const rawText = await this.extractionEngine.extract(fileBuffer, fileType);

      const cleanedText = this.textCleaningService.clean(rawText);

      if (!cleanedText || cleanedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the document.');
      }

      await this.documentRepository.updateExtractedText(documentId, cleanedText);

      await this.loggingService.logExtractionSuccess(documentId, userId, {
        fileType,
        extractedLength: cleanedText.length,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred during extraction.';

      await this.documentRepository.updateStatus(
        documentId,
        ExtractionStatus.FAILED,
        errorMessage,
      );

      await this.loggingService.logExtractionFailure(
        documentId,
        userId,
        error instanceof Error ? error : new Error(errorMessage),
        { fileType },
      );
    }
  }

  async retry(documentId: string, userId: string): Promise<void> {
    const document = await this.documentRepository.findByIdAndUserId(documentId, userId);

    if (!document) {
      throw new Error('Document not found.');
    }

    if (document.extractionStatus !== ExtractionStatus.FAILED) {
      throw new Error('Only failed extractions can be retried.');
    }

    await this.documentRepository.updateStatus(documentId, ExtractionStatus.PROCESSING);

    try {
      const rawText = await this.extractionEngine.extract(
        Buffer.alloc(0),
        document.fileType,
      );

      const cleanedText = this.textCleaningService.clean(rawText);

      if (!cleanedText || cleanedText.trim().length === 0) {
        throw new Error('No text content could be extracted from the document.');
      }

      await this.documentRepository.updateExtractedText(documentId, cleanedText);

      await this.loggingService.logExtractionSuccess(documentId, userId, {
        fileType: document.fileType,
        extractedLength: cleanedText.length,
        isRetry: true,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred during extraction.';

      await this.documentRepository.updateStatus(
        documentId,
        ExtractionStatus.FAILED,
        errorMessage,
      );

      await this.loggingService.logExtractionFailure(
        documentId,
        userId,
        error instanceof Error ? error : new Error(errorMessage),
        { fileType: document.fileType, isRetry: true },
      );
    }
  }

  async extractWithRetry(
    documentId: string,
    fileBuffer: Buffer,
    fileType: string,
    userId: string,
    maxRetries: number = this.MAX_RETRIES,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.documentRepository.updateStatus(documentId, ExtractionStatus.PROCESSING);

        if (!this.extractionEngine.isSupportedType(fileType)) {
          throw new Error(
            `Unsupported file type: ${fileType}. Only PDF, DOCX, and TXT are allowed.`,
          );
        }

        const rawText = await this.extractionEngine.extract(fileBuffer, fileType);

        const cleanedText = this.textCleaningService.clean(rawText);

        if (!cleanedText || cleanedText.trim().length === 0) {
          throw new Error('No text content could be extracted from the document.');
        }

        await this.documentRepository.updateExtractedText(documentId, cleanedText);

        await this.loggingService.logExtractionSuccess(documentId, userId, {
          fileType,
          extractedLength: cleanedText.length,
          attempt,
        });

        return;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.loggingService.logWarn(
          `Extraction attempt ${attempt}/${maxRetries} failed for document ${documentId}`,
          {
            documentId,
            userId,
            fileType,
            attempt,
            error: lastError.message,
          },
        );

        if (attempt === maxRetries) {
          break;
        }
      }
    }

    const errorMessage = lastError
      ? lastError.message
      : 'An unexpected error occurred during extraction.';

    await this.documentRepository.updateStatus(
      documentId,
      ExtractionStatus.FAILED,
      errorMessage,
    );

    await this.loggingService.logExtractionFailure(
      documentId,
      userId,
      lastError || new Error(errorMessage),
      { fileType, maxRetries },
    );
  }
}