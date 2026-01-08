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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>

      {/* Toggle */}
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-900/30">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white font-semibold transition-all duration-200 hover:gap-2.5"
        >
          <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? '' : '-rotate-90'}`} />
          Recent Conversations
        </button>
      </div>

      {/* Conversations List */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-16 text-slate-400">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex items-center justify-center h-16 text-slate-500 text-sm">
              No conversations yet
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`group relative flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-300 ${
                    currentConversationId === conv.id
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/40 text-white shadow-md'
                      : 'hover:bg-gradient-to-r hover:from-slate-800/80 hover:to-slate-700/60 text-slate-300 border border-slate-700/30 hover:border-slate-600/50 hover:shadow-sm'
                  }`}
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm leading-snug">{conv.title}</p>
                    <p className={`text-xs mt-0.5 ${
                      currentConversationId === conv.id ? 'text-blue-300/70' : 'text-slate-500'
                    }`}>
                      {formatDate(conv.updated_at)}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1.5 items-center">
                    <ExportButton 
                      conversationId={conv.id} 
                      format="markdown"
                      className="!p-1.5 !bg-slate-700/80 hover:!bg-slate-600 !text-slate-300 hover:!text-white !border-slate-600/50 hover:!border-slate-500 !rounded-lg !transition-all"
                    />
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(conv.id);
                      }}
                      className="p-1.5 hover:bg-red-500/30 rounded-lg text-red-400 hover:text-red-300 border border-transparent hover:border-red-400/40 transition-all duration-200"
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
