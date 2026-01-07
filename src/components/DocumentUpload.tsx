'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  onUploadComplete?: (count: number) => void;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      const documents = await Promise.all(
        files.map(async (file) => {
          const text = await file.text();
          return {
            content: text,
            source: file.name,
          };
        })
      );

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents }),
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setProgress(100);
      
      setTimeout(() => {
        setFiles([]);
        setIsOpen(false);
        setProgress(0);
        if (onUploadComplete) {
          onUploadComplete(data.data?.count || documents.length);
        }
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  }, [files, onUploadComplete]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
      >
        <Upload size={20} />
        Upload Documents
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upload Documents
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* File input */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  accept=".txt,.md,.doc,.docx,.pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload size={48} className="text-gray-400" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click to select files or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports: TXT, MD, DOC, DOCX, PDF
                  </p>
                </label>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      {!uploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    Uploading {files.length} document{files.length !== 1 ? 's' : ''}...
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={files.length === 0 || uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Upload {files.length} file{files.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
