import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
};

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFileSelected, disabled = false }: FileDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!file) {
      return 'No file provided. Please upload a file.';
    }

    const isValidMime = Object.keys(ALLOWED_MIME_TYPES).includes(file.type);
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    const isValidExtension = ALLOWED_EXTENSIONS.includes(extension);

    if (!isValidMime && !isValidExtension) {
      return 'Unsupported file type. Only PDF, DOCX, and TXT are allowed.';
    }

    if (file.size === 0) {
      return 'File is empty. Please upload a valid file.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit.';
    }

    return null;
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: { file: File; errors: { message: string; code: string }[] }[]) => {
      setValidationError(null);
      setSelectedFile(null);

      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        const errorCode = rejection.errors[0]?.code;

        if (errorCode === 'file-too-large') {
          setValidationError('File size exceeds 10MB limit.');
        } else if (errorCode === 'file-invalid-type') {
          setValidationError('Unsupported file type. Only PDF, DOCX, and TXT are allowed.');
        } else {
          setValidationError(rejection.errors[0]?.message || 'Invalid file. Please try again.');
        }
        return;
      }

      if (acceptedFiles.length === 0) {
        setValidationError('No file provided. Please upload a file.');
        return;
      }

      const file = acceptedFiles[0];
      const error = validateFile(file);

      if (error) {
        setValidationError(error);
        return;
      }

      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected, validateFile],
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: MAX_FILE_SIZE,
    multiple: false,
    disabled,
    noClick: false,
    noKeyboard: false,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileTypeLabel = (file: File): string => {
    const mimeLabel = ALLOWED_MIME_TYPES[file.type];
    if (mimeLabel) {
      return mimeLabel;
    }
    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.') + 1).toUpperCase();
    return extension || 'Unknown';
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
            : isDragActive
              ? 'border-blue-500 bg-blue-50'
              : validationError
                ? 'border-red-300 bg-red-50 hover:border-red-400'
                : selectedFile
                  ? 'border-green-300 bg-green-50 hover:border-green-400'
                  : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />

        {isDragActive ? (
          <div className="flex flex-col items-center space-y-2">
            <svg
              className="w-12 h-12 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-blue-600 font-medium">Drop your file here</p>
          </div>
        ) : selectedFile ? (
          <div className="flex flex-col items-center space-y-2">
            <svg
              className="w-12 h-12 text-green-500"
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
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {getFileTypeLabel(selectedFile)} · {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Drop a new file or click to replace
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <div>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, DOCX, or TXT (max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {validationError && (
        <div className="mt-2 flex items-center space-x-2">
          <svg
            className="w-4 h-4 text-red-500 flex-shrink-0"
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
          <p className="text-sm text-red-600">{validationError}</p>
        </div>
      )}
    </div>
  );
}

export default FileDropzone;