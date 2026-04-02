import { Injectable } from '@nestjs/common';
import { PdfExtractor } from './pdf-extractor';
import { DocxExtractor } from './docx-extractor';
import { TxtExtractor } from './txt-extractor';

@Injectable()
export class ExtractionEngine {
  private readonly supportedTypes: Map<string, string>;

  constructor(
    private readonly pdfExtractor: PdfExtractor,
    private readonly docxExtractor: DocxExtractor,
    private readonly txtExtractor: TxtExtractor,
  ) {
    this.supportedTypes = new Map<string, string>([
      ['application/pdf', 'pdf'],
      ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
      ['text/plain', 'txt'],
      ['pdf', 'pdf'],
      ['docx', 'docx'],
      ['txt', 'txt'],
    ]);
  }

  async extract(fileBuffer: Buffer, fileType: string): Promise<string> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('File buffer is empty or invalid.');
    }

    if (!fileType) {
      throw new Error('File type is required.');
    }

    const normalizedType = this.normalizeFileType(fileType);

    switch (normalizedType) {
      case 'pdf':
        return this.pdfExtractor.extract(fileBuffer);
      case 'docx':
        return this.docxExtractor.extract(fileBuffer);
      case 'txt':
        return this.txtExtractor.extract(fileBuffer);
      default:
        throw new Error(
          `Unsupported file type: ${fileType}. Only PDF, DOCX, and TXT are allowed.`,
        );
    }
  }

  isSupportedType(fileType: string): boolean {
    if (!fileType) {
      return false;
    }

    const normalized = fileType.toLowerCase().trim();
    return this.supportedTypes.has(normalized);
  }

  private normalizeFileType(fileType: string): string {
    const normalized = fileType.toLowerCase().trim();
    const mapped = this.supportedTypes.get(normalized);

    if (!mapped) {
      throw new Error(
        `Unsupported file type: ${fileType}. Only PDF, DOCX, and TXT are allowed.`,
      );
    }

    return mapped;
  }
}