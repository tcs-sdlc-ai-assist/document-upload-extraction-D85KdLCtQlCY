import { Injectable } from '@nestjs/common';

@Injectable()
export class TextCleaningService {
  clean(rawText: string): string {
    if (!rawText || rawText.trim().length === 0) {
      return '';
    }

    let text = rawText;

    // Remove non-printable characters (except common whitespace)
    text = this.removeNonPrintableCharacters(text);

    // Remove common header/footer patterns
    text = this.removeHeaderFooterPatterns(text);

    // Normalize line breaks
    text = this.normalizeLineBreaks(text);

    // Strip excessive whitespace
    text = this.stripExcessiveWhitespace(text);

    return text.trim();
  }

  private removeNonPrintableCharacters(text: string): string {
    // Remove non-printable characters except tabs, newlines, and carriage returns
    // eslint-disable-next-line no-control-regex
    return text.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, '');
  }

  private removeHeaderFooterPatterns(text: string): string {
    const lines = text.split('\n');
    const cleanedLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip common page number patterns
      if (/^(page\s+)?\d+(\s+of\s+\d+)?$/i.test(trimmedLine)) {
        continue;
      }

      // Skip lines that are only dashes, underscores, or equals (separators)
      if (/^[-_=]{3,}$/.test(trimmedLine)) {
        continue;
      }

      // Skip common header/footer markers
      if (/^(header|footer|confidential|draft|page\s*\d*)$/i.test(trimmedLine)) {
        continue;
      }

      cleanedLines.push(line);
    }

    return cleanedLines.join('\n');
  }

  private normalizeLineBreaks(text: string): string {
    // Normalize Windows-style line breaks to Unix-style
    let normalized = text.replace(/\r\n/g, '\n');

    // Normalize standalone carriage returns
    normalized = normalized.replace(/\r/g, '\n');

    // Collapse more than two consecutive newlines into two
    normalized = normalized.replace(/\n{3,}/g, '\n\n');

    return normalized;
  }

  private stripExcessiveWhitespace(text: string): string {
    // Replace multiple spaces/tabs with a single space (within lines)
    const lines = text.split('\n');
    const cleanedLines = lines.map((line) => {
      return line.replace(/[ \t]+/g, ' ').trim();
    });

    return cleanedLines.join('\n');
  }
}