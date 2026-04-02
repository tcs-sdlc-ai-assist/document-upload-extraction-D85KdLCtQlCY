import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file provided. Please upload a file.');
    }

    if (!file.mimetype || !this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file type. Only PDF, DOCX, and TXT are allowed.',
      );
    }

    if (!file.size || file.size === 0) {
      throw new BadRequestException('File is empty. Please upload a valid file.');
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 10MB limit.');
    }

    return file;
  }
}