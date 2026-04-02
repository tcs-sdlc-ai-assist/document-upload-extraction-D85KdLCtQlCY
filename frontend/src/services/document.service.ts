import api from '@/services/api';
import {
  UploadResponse,
  DocumentStatus,
  ExtractionResult,
  RetryResponse,
} from '@/types/types';

export async function uploadDocument(
  file: File,
  onUploadProgress?: (progress: number) => void,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<UploadResponse>('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percent);
      }
    },
  });

  return response.data;
}

export async function getDocumentStatus(documentId: string): Promise<DocumentStatus> {
  const response = await api.get<DocumentStatus>(`/documents/${documentId}/status`);
  return response.data;
}

export async function getDocumentResult(documentId: string): Promise<ExtractionResult> {
  const response = await api.get<ExtractionResult>(`/documents/${documentId}/result`);
  return response.data;
}

export async function retryExtraction(documentId: string): Promise<RetryResponse> {
  const response = await api.post<RetryResponse>(`/documents/${documentId}/retry`);
  return response.data;
}