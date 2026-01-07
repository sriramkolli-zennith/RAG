'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { RotateCcw, Copy, Check } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    similarity: number;
  }>;
  timestamp?: Date;
}

interface ChatMessageProps {
  message: Message;
  onViewSources?: () => void;
  onRegenerate?: (messageId: string) => Promise<void>;
  isLoading?: boolean;
}

export function ChatMessage({ message, onViewSources, onRegenerate, isLoading = false }: ChatMessageProps) {
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleRegenerate = async () => {
    if (!onRegenerate || !message.id) return;
    setRegenerating(true);
    try {
      await onRegenerate(message.id);
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn mb-4`}>
      <div
        className={`max-w-2xl rounded-lg p-4 ${
          isUser
            ? 'bg-slate-900 text-white border border-slate-800'
            : 'bg-slate-950 text-slate-100 border border-slate-800'
        }`}
      >
        {isLoading ? (
          <div className="flex gap-2 items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : isUser ? (
          <p className="m-0 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <div className="prose prose-invert max-w-none text-sm mb-2">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                  code: ({ children }) => (
                    <code className="px-2 py-1 rounded text-xs font-mono bg-slate-900">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="overflow-x-auto p-2 rounded text-xs mb-2 bg-slate-900">
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-700">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-xs px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 transition-colors"
                title="Copy message"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {onRegenerate && message.id && (
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex items-center gap-1 text-xs px-2 py-1.5 rounded bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Regenerate response"
                >
                  <RotateCcw size={14} className={regenerating ? 'animate-spin' : ''} />
                  {regenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
