import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorMessage } from '@/components/ErrorMessage';
import { ExtractionStatus, ApiError } from '@/types/types';
import api from '@/services/api';

interface DocumentListItem {
  documentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extractedText: string | null;
  status: ExtractionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export function DocumentHistoryPage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<DocumentListItem[]>('/documents');
      setDocuments(response.data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to fetch documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeLabel = (fileType: string): string => {
    const typeMap: Record<string, string> = {
      pdf: 'PDF',
      docx: 'DOCX',
      txt: 'TXT',
    };
    return typeMap[fileType.toLowerCase()] || fileType.toUpperCase();
  };

  const getStatusBadge = (status: ExtractionStatus) => {
    const badgeStyles: Record<string, string> = {
      [ExtractionStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [ExtractionStatus.PROCESSING]: 'bg-blue-100 text-blue-800',
      [ExtractionStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [ExtractionStatus.FAILED]: 'bg-red-100 text-red-800',
    };

    const badgeLabels: Record<string, string> = {
      [ExtractionStatus.PENDING]: 'Pending',
      [ExtractionStatus.PROCESSING]: 'Processing',
      [ExtractionStatus.COMPLETED]: 'Completed',
      [ExtractionStatus.FAILED]: 'Failed',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[status] || 'bg-gray-100 text-gray-800'}`}
      >
        {badgeLabels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) {
      return '—';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    const color =
      fileType.toLowerCase() === 'pdf'
        ? 'text-red-500'
        : fileType.toLowerCase() === 'docx'
          ? 'text-blue-500'
          : 'text-gray-500';

    return (
      <svg
        className={`w-8 h-8 ${color} flex-shrink-0`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  };

  const handleViewResult = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document History</h2>
          <p className="mt-1 text-sm text-gray-600">
            View your previously uploaded documents and their extraction results.
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm">Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document History</h2>
          <p className="mt-1 text-sm text-gray-600">
            View your previously uploaded documents and their extraction results.
          </p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Upload New
        </button>
      </div>

      {error && (
        <ErrorMessage message={error} onRetry={fetchDocuments} />
      )}

      {!error && documents.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mb-1">No documents yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload your first document to get started with text extraction.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Upload Document
          </button>
        </div>
      )}

      {!error && documents.length > 0 && (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.documentId}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-4">
                {getFileTypeIcon(doc.fileType)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.fileName}
                    </p>
                    {getStatusBadge(doc.status)}
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{getFileTypeLabel(doc.fileType)}</span>
                    <span>·</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    {doc.createdAt && (
                      <>
                        <span>·</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {doc.status === ExtractionStatus.COMPLETED && (
                    <button
                      onClick={() => handleViewResult(doc.documentId)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 border border-blue-300 text-blue-700 bg-white hover:bg-blue-50"
                    >
                      <svg
                        className="w-3.5 h-3.5 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Result
                    </button>
                  )}
                  {doc.status === ExtractionStatus.FAILED && (
                    <button
                      onClick={() => handleViewResult(doc.documentId)}
                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 border border-red-300 text-red-700 bg-white hover:bg-red-50"
                    >
                      <svg
                        className="w-3.5 h-3.5 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Retry
                    </button>
                  )}
                  {(doc.status === ExtractionStatus.PENDING ||
                    doc.status === ExtractionStatus.PROCESSING) && (
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DocumentHistoryPage;