import React, { useState } from 'react';
import { ExtractionResult as ExtractionResultType, ExtractionStatus } from '@/types/types';

interface ExtractionResultProps {
  result: ExtractionResultType;
}

export function ExtractionResult({ result }: ExtractionResultProps) {
  const [copied, setCopied] = useState(false);

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

  const handleCopyToClipboard = async () => {
    if (!result.extractedText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = result.extractedText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Copy failed silently
      }
      document.body.removeChild(textArea);
    }
  };

  const isCompleted = result.status === ExtractionStatus.COMPLETED;
  const hasText = !!result.extractedText && result.extractedText.trim().length > 0;

  return (
    <div className="w-full space-y-4">
      {/* File Metadata Summary Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Document Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
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
            <div>
              <p className="text-xs text-gray-500">File Name</p>
              <p className="text-sm font-medium text-gray-900 truncate">{result.fileName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            <div>
              <p className="text-xs text-gray-500">File Type</p>
              <p className="text-sm font-medium text-gray-900">{getFileTypeLabel(result.fileType)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
              />
            </svg>
            <div>
              <p className="text-xs text-gray-500">File Size</p>
              <p className="text-sm font-medium text-gray-900">{formatFileSize(result.fileSize)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
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
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  isCompleted
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {isCompleted ? 'Completed' : result.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Text Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Extracted Text</h3>
          {hasText && (
            <button
              onClick={handleCopyToClipboard}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              {copied ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 mr-1.5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy to Clipboard
                </>
              )}
            </button>
          )}
        </div>

        <div className="p-4">
          {hasText ? (
            <div className="max-h-96 overflow-y-auto rounded-md bg-gray-50 border border-gray-100 p-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono leading-relaxed">
                {result.extractedText}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg
                className="w-10 h-10 text-gray-300 mb-3"
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
              <p className="text-sm text-gray-500">
                {isCompleted
                  ? 'No text content was extracted from this document.'
                  : 'Extraction is still in progress. Please check back shortly.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExtractionResult;