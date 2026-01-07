'use client';

import { X } from 'lucide-react';

interface Source {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

interface SourcesPanelProps {
  sources: Source[];
  isOpen: boolean;
  onClose: () => void;
}

export function SourcesPanel({ sources, isOpen, onClose }: SourcesPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="w-96 border-l border-slate-700 bg-slate-900 flex flex-col h-full shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800">
        <h3 className="text-sm font-semibold text-slate-100">📚 Sources</h3>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors duration-150"
        >
          <X size={16} className="text-slate-400 hover:text-white" />
        </button>
      </div>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {sources.length === 0 ? (
          <p className="text-slate-500 text-center py-8 text-sm">No sources found</p>
        ) : (
          sources.map((source, index) => {
            const similarity = source.similarity || 0;
            const getQualityColor = () => {
              if (similarity >= 0.9) return 'from-emerald-500 to-teal-500 text-white';
              if (similarity >= 0.85) return 'from-blue-500 to-cyan-500 text-white';
              return 'from-amber-500 to-orange-500 text-white';
            };

            return (
              <div
                key={source.id}
                className=\"bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-all duration-150 hover:shadow-lg\"
              >
                <div className=\"flex items-center justify-between mb-2\">
                  <span className=\"text-xs font-medium text-slate-400\">
                    Source {index + 1}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gradient-to-r ${getQualityColor()}`}>
                    {(similarity * 100).toFixed(0)}%
                  </span>
                </div>
                
                {typeof source.metadata?.source === 'string' && (
                  <p className=\"text-sm text-cyan-400 mb-2 font-semibold truncate\">
                    📄 {source.metadata.source}
                  </p>
                )}
                
                <p className=\"text-xs text-slate-300 leading-relaxed line-clamp-4 whitespace-pre-wrap\">
                  {source.content}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
