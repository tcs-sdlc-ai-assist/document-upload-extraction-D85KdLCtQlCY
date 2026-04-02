import { Injectable } from '@nestjs/common';

@Injectable()
export class TxtExtractor {
  async extract(fileBuffer: Buffer): Promise<string> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('TXT file buffer is empty or invalid.');
    }

    try {
      let text: string;

      if (
        fileBuffer[0] === 0xef &&
        fileBuffer[1] === 0xbb &&
        fileBuffer[2] === 0xbf
      ) {
        text = fileBuffer.subarray(3).toString('utf-8');
      } else if (
        (fileBuffer[0] === 0xfe && fileBuffer[1] === 0xff) ||
        (fileBuffer[0] === 0xff && fileBuffer[1] === 0xfe)
      ) {
        const encoding =
          fileBuffer[0] === 0xff && fileBuffer[1] === 0xfe
            ? 'utf-16le'
            : 'utf-16be';

        const decoder = new TextDecoder(encoding);
        text = decoder.decode(fileBuffer.subarray(2));
      } else {
        text = fileBuffer.toString('utf-8');
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No text content could be extracted from the TXT file.');
      }

      return text;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('No text content')) {
          throw error;
        }

        if (
          error.message.includes('encoding') ||
          error.message.includes('decode') ||
          error.message.includes('Invalid')
        ) {
          throw new Error(
            `Malformed or corrupted TXT file: ${error.message}`,
          );
        }

        throw new Error(`Failed to extract text from TXT: ${error.message}`);
      }

      throw new Error('An unexpected error occurred during TXT extraction.');
    }
  }
}