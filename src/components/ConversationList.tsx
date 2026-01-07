'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Edit2, Archive, Download } from 'lucide-react';
import ExportButton from './ExportButton';

interface Conversation {
  id: string;
  session_id: string;
  title: string;
  updated_at: string;
  archived: boolean;
}

interface ConversationListProps {
  currentConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
}

export default function ConversationList({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      if (data.success) {
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (conversationId: string) => {
    if (!confirm('Delete this conversation?')) return;

    try {
      const response = await fetch(`/api/conversations?id=${conversationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setConversations(prev => prev.filter(c => c.id !== conversationId));
        onDeleteConversation(conversationId);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>

      {/* Toggle */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium"
        >
          <ChevronDown size={16} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          Conversations
        </button>
      </div>

      {/* Conversations List */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-16 text-gray-500 dark:text-gray-400">
              Loading...
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-gray-500 dark:text-gray-400 text-sm">
              No conversations yet
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conv.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">{conv.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <ExportButton 
                      conversationId={conv.id} 
                      format="markdown"
                      className="!p-1 !bg-transparent hover:!bg-gray-300 dark:hover:!bg-gray-600 !text-gray-600 dark:!text-gray-400"
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(conv.id);
                      }}
                      className="p-1 hover:bg-red-200 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
