import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document, ExtractionStatus } from '../entities/document.entity';

export interface DocumentMeta {
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileHash?: string;
}

@Injectable()
export class DocumentRepository {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

  async createDocument(meta: DocumentMeta): Promise<Document> {
    const document = this.documentRepository.create({
      userId: meta.userId,
      fileName: meta.fileName,
      fileType: meta.fileType,
      fileSize: meta.fileSize,
      fileHash: meta.fileHash || null,
      extractionStatus: ExtractionStatus.PENDING,
    });

    return this.documentRepository.save(document);
  }

  async findById(id: string): Promise<Document | null> {
    return this.documentRepository.findOne({
      where: { id },
    });
  }

  async findByUserId(userId: string): Promise<Document[]> {
    return this.documentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByHash(fileHash: string, userId: string): Promise<Document | null> {
    return this.documentRepository.findOne({
      where: { fileHash, userId },
    });
  }

  async updateStatus(
    id: string,
    status: ExtractionStatus,
    error?: string,
  ): Promise<void> {
    const updateData: Partial<Document> = {
      extractionStatus: status,
    };

    if (error !== undefined) {
      updateData.errorMessage = error;
    }

    if (status === ExtractionStatus.PROCESSING) {
      updateData.errorMessage = null;
    }

    await this.documentRepository.update(id, updateData);
  }

  async updateExtractedText(id: string, text: string): Promise<void> {
    await this.documentRepository.update(id, {
      extractedText: text,
      extractionStatus: ExtractionStatus.COMPLETED,
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Document | null> {
    return this.documentRepository.findOne({
      where: { id, userId },
    });
  }
}