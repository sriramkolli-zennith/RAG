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
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
      >
        <Upload size={20} />
        Upload Documents
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-2xl w-full p-8 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">
                Upload Documents
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-all"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-5">
              {/* File input */}
              <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-10 text-center hover:border-blue-500/50 transition-all bg-slate-800/30">
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
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                    <Upload size={48} className="text-blue-400" />
                  </div>
                  <p className="text-sm text-slate-300 font-medium">
                    Click to select files or drag and drop
                  </p>
                  <p className="text-xs text-slate-500">
                    Supports: TXT, MD, DOC, DOCX, PDF
                  </p>
                </label>
              </div>

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl border border-slate-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                          <FileText size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      {!uploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-slate-400 hover:text-red-400 transition-all border border-transparent hover:border-red-500/30"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Progress bar */}
              {uploading && (
                <div className="space-y-3">
                  <div className="w-full bg-slate-800/60 rounded-full h-2.5 border border-slate-700/50">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-blue-500 h-2.5 rounded-full transition-all duration-300 shadow-lg shadow-blue-500/30"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-slate-300">
                    Uploading {files.length} document{files.length !== 1 ? 's' : ''}...
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-700/50 hover:bg-slate-800/60 text-slate-300 hover:text-white disabled:opacity-50 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={files.length === 0 || uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 font-medium"
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
