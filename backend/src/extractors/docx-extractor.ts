import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';

@Injectable()
export class DocxExtractor {
  async extract(fileBuffer: Buffer): Promise<string> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('DOCX file buffer is empty or invalid.');
    }

    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });

      if (!result || !result.value) {
        throw new Error('No text content could be extracted from the DOCX.');
      }

      return result.value;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('Could not find') ||
          error.message.includes('End of data') ||
          error.message.includes('Invalid ZIP') ||
          error.message.includes('Corrupted')
        ) {
          throw new Error(
            `Malformed or corrupted DOCX file: ${error.message}`,
          );
        }

        if (error.message.includes('No text content')) {
          throw error;
        }

        throw new Error(`Failed to extract text from DOCX: ${error.message}`);
      }

      throw new Error('An unexpected error occurred during DOCX extraction.');
    }
  }
}