'use client';

import ReactMarkdown from 'react-markdown';

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
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
  onViewSources?: () => void;
}

export function ChatMessage({ message, onViewSources }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex message-enter ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
        }`}
      >
        {/* Avatar and role indicator */}
        <div className="flex items-center space-x-2 mb-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              isUser ? 'bg-blue-500' : 'bg-gray-100'
            }`}
          >
            {isUser ? '👤' : '🤖'}
          </div>
          <span className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className={`text-xs ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Message content */}
        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
          {isUser ? (
            <p className="m-0">{message.content}</p>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>

        {/* Sources button */}
        {onViewSources && message.sources && message.sources.length > 0 && (
          <button
            onClick={onViewSources}
            className="mt-3 flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>📚</span>
            <span>View {message.sources.length} source(s)</span>
          </button>
        )}
      </div>
    </div>
  );
}
