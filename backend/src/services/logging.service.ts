import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';
import { logger } from '../config/logger.config';

@Injectable()
export class LoggingService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  logInfo(message: string, context?: Record<string, unknown>): void {
    logger.info(message, { ...context });
  }

  logWarn(message: string, context?: Record<string, unknown>): void {
    logger.warn(message, { ...context });
  }

  logError(contextName: string, error: Error, meta?: Record<string, unknown>): void {
    logger.error(`[${contextName}] ${error.message}`, {
      stack: error.stack,
      ...meta,
    });
  }

  logEvent(eventType: string, meta?: Record<string, unknown>): void {
    logger.info(`Event: ${eventType}`, { eventType, ...meta });
  }

  async persistAuditLog(
    eventType: string,
    userId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
  ): Promise<AuditLog> {
    try {
      const auditLog = this.auditLogRepository.create({
        eventType,
        userId: userId || null,
        details: details || null,
        ipAddress: ipAddress || null,
      });

      const saved = await this.auditLogRepository.save(auditLog);

      logger.debug(`Audit log persisted: ${eventType}`, {
        auditLogId: saved.id,
        eventType,
        userId,
      });

      return saved;
    } catch (error) {
      logger.error('Failed to persist audit log', {
        eventType,
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async logSecurityEvent(
    eventType: string,
    userId?: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
  ): Promise<void> {
    this.logEvent(eventType, { userId, ipAddress, ...details });
    await this.persistAuditLog(eventType, userId, details, ipAddress);
  }

  async logExtractionSuccess(
    documentId: string,
    userId: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    this.logInfo(`Extraction completed for document ${documentId}`, {
      documentId,
      userId,
      ...details,
    });
    await this.persistAuditLog('EXTRACTION_SUCCESS', userId, {
      documentId,
      ...details,
    });
  }

  async logExtractionFailure(
    documentId: string,
    userId: string,
    error: Error,
    details?: Record<string, unknown>,
  ): Promise<void> {
    this.logError('extraction', error, {
      documentId,
      userId,
      ...details,
    });
    await this.persistAuditLog('EXTRACTION_FAILURE', userId, {
      documentId,
      errorMessage: error.message,
      ...details,
    });
  }

  async logUploadEvent(
    documentId: string,
    userId: string,
    fileName: string,
    fileType: string,
    fileSize: number,
    ipAddress?: string,
  ): Promise<void> {
    this.logInfo(`File uploaded: ${fileName}`, {
      documentId,
      userId,
      fileName,
      fileType,
      fileSize,
    });
    await this.persistAuditLog(
      'UPLOAD',
      userId,
      { documentId, fileName, fileType, fileSize },
      ipAddress,
    );
  }
}