import React from 'react';
import { ExtractionStatus } from '@/types/types';

interface UploadProgressProps {
  fileName: string;
  uploadProgress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  extractionStatus?: ExtractionStatus | null;
  extractionProgress?: number;
  error?: string | null;
  onRetry?: () => void;
}

export function UploadProgress({
  fileName,
  uploadProgress,
  status,
  extractionStatus,
  extractionProgress = 0,
  error,
  onRetry,
}: UploadProgressProps) {
  const getStatusMessage = (): string => {
    if (status === 'uploading') {
      return `Uploading ${fileName}...`;
    }

    if (status === 'error' && !extractionStatus) {
      return error || 'Upload failed. Please try again.';
    }

    if (status === 'success' || extractionStatus) {
      switch (extractionStatus) {
        case ExtractionStatus.PENDING:
          return 'Waiting to start extraction...';
        case ExtractionStatus.PROCESSING:
          return 'Extracting text from document...';
        case ExtractionStatus.COMPLETED:
          return 'Extraction completed successfully.';
        case ExtractionStatus.FAILED:
          return error || 'Extraction failed. Please retry.';
        default:
          return 'Upload successful. Starting extraction...';
      }
    }

    return '';
  };

  const getProgressPercent = (): number => {
    if (status === 'uploading') {
      return uploadProgress;
    }

    if (extractionStatus) {
      return extractionProgress;
    }

    if (status === 'success') {
      return 100;
    }

    return 0;
  };

  const getProgressBarColor = (): string => {
    if (status === 'error' || extractionStatus === ExtractionStatus.FAILED) {
      return 'bg-red-500';
    }

    if (extractionStatus === ExtractionStatus.COMPLETED) {
      return 'bg-green-500';
    }

    return 'bg-blue-500';
  };

  const getStatusIcon = () => {
    if (status === 'error' || extractionStatus === ExtractionStatus.FAILED) {
      return (
        <svg
          className="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }

    if (extractionStatus === ExtractionStatus.COMPLETED) {
      return (
        <svg
          className="w-5 h-5 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }

    if (
      status === 'uploading' ||
      extractionStatus === ExtractionStatus.PROCESSING ||
      extractionStatus === ExtractionStatus.PENDING
    ) {
      return (
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      );
    }

    return null;
  };

  const getStatusBadge = () => {
    if (!extractionStatus && status !== 'error') {
      return null;
    }

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

    if (status === 'error' && !extractionStatus) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Error
        </span>
      );
    }

    if (extractionStatus) {
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[extractionStatus]}`}
        >
          {badgeLabels[extractionStatus]}
        </span>
      );
    }

    return null;
  };

  const progressPercent = getProgressPercent();
  const statusMessage = getStatusMessage();

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3 min-w-0">
          {getStatusIcon()}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
          {getStatusBadge()}
          {(status === 'uploading' ||
            extractionStatus === ExtractionStatus.PROCESSING ||
            extractionStatus === ExtractionStatus.PENDING) && (
            <span className="text-sm font-medium text-gray-600">{progressPercent}%</span>
          )}
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ease-in-out ${getProgressBarColor()}`}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      <div className="flex items-center justify-between">
        <p
          className={`text-xs ${
            status === 'error' || extractionStatus === ExtractionStatus.FAILED
              ? 'text-red-600'
              : extractionStatus === ExtractionStatus.COMPLETED
                ? 'text-green-600'
                : 'text-gray-500'
          }`}
        >
          {statusMessage}
        </p>

        {(status === 'error' || extractionStatus === ExtractionStatus.FAILED) && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 rounded transition-colors"
          >
            <svg
              className="w-3 h-3 mr-1"
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
      </div>
    </div>
  );
}

export default UploadProgress;