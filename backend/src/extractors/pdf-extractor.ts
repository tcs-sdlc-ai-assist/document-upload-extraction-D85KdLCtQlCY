import { Injectable } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class PdfExtractor {
  async extract(fileBuffer: Buffer): Promise<string> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('PDF file buffer is empty or invalid.');
    }

    try {
      const data = await pdfParse(fileBuffer);

      if (!data || !data.text) {
        throw new Error('No text content could be extracted from the PDF.');
      }

      return data.text;
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('Invalid PDF') ||
          error.message.includes('bad XRef') ||
          error.message.includes('stream must have data')
        ) {
          throw new Error(
            `Malformed or corrupted PDF file: ${error.message}`,
          );
        }

        if (error.message.includes('No text content')) {
          throw error;
        }

        throw new Error(`Failed to extract text from PDF: ${error.message}`);
      }

      throw new Error('An unexpected error occurred during PDF extraction.');
    }
  }
}