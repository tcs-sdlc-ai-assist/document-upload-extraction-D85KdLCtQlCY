import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ExtractionStatus } from '../enums/extraction-status.enum';

export class UploadResponseDto {
  @IsUUID()
  documentId: string;

  @IsEnum(ExtractionStatus)
  status: ExtractionStatus;
}

export class DocumentStatusDto {
  @IsUUID()
  documentId: string;

  @IsEnum(ExtractionStatus)
  status: ExtractionStatus;

  @IsNumber()
  progress: number;

  @IsOptional()
  @IsString()
  error: string | null;
}

export class DocumentResultDto {
  @IsUUID()
  documentId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsNumber()
  fileSize: number;

  @IsOptional()
  @IsString()
  extractedText: string | null;

  @IsEnum(ExtractionStatus)
  status: ExtractionStatus;
}

export class RetryResponseDto {
  @IsUUID()
  documentId: string;

  @IsEnum(ExtractionStatus)
  status: ExtractionStatus;
}