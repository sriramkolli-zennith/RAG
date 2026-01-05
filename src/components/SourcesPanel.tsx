'use client';

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
    <div className="w-96 border-l bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-gray-800">📚 Sources</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sources.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sources available</p>
        ) : (
          sources.map((source, index) => (
            <div
              key={source.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Source {index + 1}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    source.similarity >= 0.9
                      ? 'bg-green-100 text-green-700'
                      : source.similarity >= 0.8
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {(source.similarity * 100).toFixed(1)}% match
                </span>
              </div>
              
              {typeof source.metadata?.source === 'string' && (
                <p className="text-xs text-gray-500 mb-2">
                  📄 {source.metadata.source}
                </p>
              )}
              
              <p className="text-sm text-gray-600 leading-relaxed">
                {source.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Footer info */}
      <div className="p-4 border-t bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          These sources were used to generate the response.
          Higher match % indicates more relevant content.
        </p>
      </div>
    </div>
  );
}
