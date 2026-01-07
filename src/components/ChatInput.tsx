'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative flex gap-3 items-end">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything... (Shift+Enter for new line)"
            disabled={disabled || isSubmitting}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 resize-none focus:outline-none focus:ring-1 focus:ring-slate-700 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed max-h-32"
            rows={1}
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || disabled || isSubmitting}
          className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95 border border-slate-800"
          title="Send message (Enter)"
        >
          {isSubmitting ? (
            <Loader2 size={20} className="animate-spin text-slate-400" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
      <p className="text-xs text-slate-600 text-center">
        Press <kbd className="px-2 py-1 bg-slate-900 rounded text-slate-500 border border-slate-800">Enter</kbd> to send • <kbd className="px-2 py-1 bg-slate-900 rounded text-slate-500 border border-slate-800">Shift+Enter</kbd> for new line
      </p>
    </form>
  );
}
