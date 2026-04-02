import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileDropzone } from '@/components/FileDropzone';
import { UploadProgress } from '@/components/UploadProgress';
import { ExtractionResult } from '@/components/ExtractionResult';
import { ErrorMessage } from '@/components/ErrorMessage';
import {
  uploadDocument,
  getDocumentStatus,
  getDocumentResult,
  retryExtraction,
} from '@/services/document.service';
import {
  ExtractionStatus,
  ExtractionResult as ExtractionResultType,
  ApiError,
  UploadProgress as UploadProgressType,
} from '@/types/types';

const POLLING_INTERVAL_MS = 2000;
const MAX_POLLING_ATTEMPTS = 150; // 5 minutes at 2s intervals

export function UploadPage() {
  const [uploadState, setUploadState] = useState<UploadProgressType>({
    documentId: null,
    fileName: '',
    progress: 0,
    status: 'idle',
    error: null,
  });

  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus | null>(null);
  const [extractionProgress, setExtractionProgress] = useState<number>(0);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResultType | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingAttemptsRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollingAttemptsRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const fetchResult = useCallback(async (documentId: string) => {
    try {
      const extractionResult = await getDocumentResult(documentId);
      setResult(extractionResult);
    } catch (err) {
      const apiError = err as ApiError;
      setGlobalError(apiError.message || 'Failed to fetch extraction result.');
    }
  }, []);

  const startPolling = useCallback(
    (documentId: string) => {
      stopPolling();
      pollingAttemptsRef.current = 0;

      pollingRef.current = setInterval(async () => {
        pollingAttemptsRef.current += 1;

        if (pollingAttemptsRef.current > MAX_POLLING_ATTEMPTS) {
          stopPolling();
          setExtractionStatus(ExtractionStatus.FAILED);
          setExtractionError('Extraction timed out. Please retry.');
          setExtractionProgress(0);
          return;
        }

        try {
          const status = await getDocumentStatus(documentId);

          setExtractionStatus(status.status);
          setExtractionProgress(status.progress);
          setExtractionError(status.error);

          if (status.status === ExtractionStatus.COMPLETED) {
            stopPolling();
            await fetchResult(documentId);
          } else if (status.status === ExtractionStatus.FAILED) {
            stopPolling();
            setExtractionError(status.error || 'Extraction failed. Please retry.');
          }
        } catch (err) {
          const apiError = err as ApiError;
          stopPolling();
          setExtractionStatus(ExtractionStatus.FAILED);
          setExtractionError(apiError.message || 'Failed to check extraction status.');
          setExtractionProgress(0);
        }
      }, POLLING_INTERVAL_MS);
    },
    [stopPolling, fetchResult],
  );

  const handleFileSelected = useCallback(
    async (file: File) => {
      // Reset state
      setResult(null);
      setGlobalError(null);
      setExtractionStatus(null);
      setExtractionProgress(0);
      setExtractionError(null);
      stopPolling();

      setUploadState({
        documentId: null,
        fileName: file.name,
        progress: 0,
        status: 'uploading',
        error: null,
      });

      try {
        const response = await uploadDocument(file, (progress) => {
          setUploadState((prev) => ({
            ...prev,
            progress,
          }));
        });

        setUploadState((prev) => ({
          ...prev,
          documentId: response.documentId,
          progress: 100,
          status: 'success',
          error: null,
        }));

        setExtractionStatus(response.status);
        setExtractionProgress(50);

        startPolling(response.documentId);
      } catch (err) {
        const apiError = err as ApiError;
        const errorMessage = apiError.message || 'Upload failed. Please try again.';

        setUploadState((prev) => ({
          ...prev,
          status: 'error',
          error: errorMessage,
        }));

        setGlobalError(errorMessage);
      }
    },
    [stopPolling, startPolling],
  );

  const handleRetry = useCallback(async () => {
    const documentId = uploadState.documentId;

    if (!documentId) {
      setGlobalError('No document to retry. Please upload a file first.');
      return;
    }

    setGlobalError(null);
    setExtractionError(null);
    setResult(null);
    setExtractionStatus(ExtractionStatus.PROCESSING);
    setExtractionProgress(50);

    try {
      const response = await retryExtraction(documentId);

      setExtractionStatus(response.status);
      startPolling(documentId);
    } catch (err) {
      const apiError = err as ApiError;
      const errorMessage = apiError.message || 'Retry failed. Please try again.';

      setExtractionStatus(ExtractionStatus.FAILED);
      setExtractionError(errorMessage);
      setExtractionProgress(0);
      setGlobalError(errorMessage);
    }
  }, [uploadState.documentId, startPolling]);

  const handleReset = useCallback(() => {
    stopPolling();
    setUploadState({
      documentId: null,
      fileName: '',
      progress: 0,
      status: 'idle',
      error: null,
    });
    setExtractionStatus(null);
    setExtractionProgress(0);
    setExtractionError(null);
    setResult(null);
    setGlobalError(null);
  }, [stopPolling]);

  const isUploading = uploadState.status === 'uploading';
  const isProcessing =
    extractionStatus === ExtractionStatus.PENDING ||
    extractionStatus === ExtractionStatus.PROCESSING;
  const isCompleted = extractionStatus === ExtractionStatus.COMPLETED;
  const isFailed =
    uploadState.status === 'error' || extractionStatus === ExtractionStatus.FAILED;
  const showProgress = uploadState.status !== 'idle';
  const showResult = isCompleted && result !== null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Document</h2>
        <p className="mt-1 text-sm text-gray-600">
          Upload a PDF, DOCX, or TXT file to extract text content.
        </p>
      </div>

      {globalError && !showProgress && (
        <ErrorMessage
          message={globalError}
          onRetry={uploadState.documentId ? handleRetry : undefined}
        />
      )}

      <FileDropzone
        onFileSelected={handleFileSelected}
        disabled={isUploading || isProcessing}
      />

      {showProgress && (
        <UploadProgress
          fileName={uploadState.fileName}
          uploadProgress={uploadState.progress}
          status={uploadState.status}
          extractionStatus={extractionStatus}
          extractionProgress={extractionProgress}
          error={extractionError || uploadState.error}
          onRetry={isFailed ? (uploadState.documentId ? handleRetry : undefined) : undefined}
        />
      )}

      {showResult && result && <ExtractionResult result={result} />}

      {(isCompleted || isFailed) && (
        <div className="flex justify-center">
          <button
            onClick={handleReset}
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
            Upload Another Document
          </button>
        </div>
      )}
    </div>
  );
}

export default UploadPage;