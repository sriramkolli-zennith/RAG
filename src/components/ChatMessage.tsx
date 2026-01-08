'use client';

import { useState, memo } from 'react';
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

function ChatMessageComponent({ message, onViewSources, onRegenerate, isLoading = false }: ChatMessageProps) {
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
        className={`max-w-3xl rounded-2xl p-4 ${
          isUser
            ? 'bg-gradient-to-br from-black to-gray-900 text-white shadow-lg shadow-black/20 border border-gray-500/30'
            : 'bg-slate-900/60 backdrop-blur-sm text-slate-100 border border-slate-700/50 shadow-xl'
        }`}
      >
        {isLoading ? (
          <div className="flex gap-2 items-center py-2">
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" />
            <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        ) : isUser ? (
          <p className="m-0 leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <div className="prose prose-invert max-w-none text-sm mb-2">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-slate-200">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                  code: ({ children }) => (
                    <code className="px-2 py-1 rounded text-xs font-mono bg-slate-800/80 text-blue-300 border border-slate-700/50">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="overflow-x-auto p-3 rounded-lg text-xs mb-3 bg-slate-800/80 border border-slate-700/50">
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-700/50">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition-all duration-200 border border-slate-700/50"
                title="Copy message"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span className={copied ? 'text-green-400' : ''}>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
              {onRegenerate && message.id && (
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700/50"
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

// Memoize to prevent unnecessary re-renders
export const ChatMessage = memo(ChatMessageComponent, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isLoading === nextProps.isLoading
  );
});

ChatMessage.displayName = 'ChatMessage';
