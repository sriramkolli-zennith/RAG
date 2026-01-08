'use client';

import { useCallback } from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  conversationId: string;
  format?: 'json' | 'markdown';
  className?: string;
  showText?: boolean;
}

export default function ExportButton({ 
  conversationId, 
  format = 'markdown',
  className = '',
  showText = true
}: ExportButtonProps) {
  const handleExport = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/export?format=${format}`
      );

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation.${format === 'json' ? 'json' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export conversation');
    }
  }, [conversationId, format]);

  return (
    <button
      onClick={handleExport}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors ${className}`}
    >
      <Download size={16} />
      {showText && `Export ${format === 'json' ? 'JSON' : 'Markdown'}`}
    </button>
  );
}
