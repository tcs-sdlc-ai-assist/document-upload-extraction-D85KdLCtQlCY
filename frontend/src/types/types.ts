export enum ExtractionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Session {
  user: User;
  expiresAt: string;
}

export interface Document {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string | null;
  extractionStatus: ExtractionStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UploadProgress {
  documentId: string | null;
  fileName: string;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error: string | null;
}

export interface UploadResponse {
  documentId: string;
  status: ExtractionStatus;
}

export interface DocumentStatus {
  documentId: string;
  status: ExtractionStatus;
  progress: number;
  error: string | null;
}

export interface ExtractionResult {
  documentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string | null;
  status: ExtractionStatus;
}

export interface RetryResponse {
  documentId: string;
  status: ExtractionStatus;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LogoutResponse {
  message: string;
}