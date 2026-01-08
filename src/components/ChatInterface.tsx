'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import ConversationList from './ConversationList';
import { Menu, X, Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  sources?: any[];
  created_at?: string;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef(uuidv4()); // Use ref to avoid recreating
  const [conversationId, setConversationId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversationTitle, setConversationTitle] = useState('New Chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Load conversation messages with memoization
  const loadConversationMessages = useCallback(async (convId: string) => {
    try {
      const response = await fetch(`/api/conversations/${convId}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(
          data.data.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            sources: msg.sources,
            created_at: msg.created_at,
          }))
        );
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, []);

  const handleSelectConversation = useCallback((convId: string) => {
    setConversationId(convId);
    loadConversationMessages(convId);
  }, [loadConversationMessages]);

  const handleNewConversation = useCallback(async () => {
    try {
      const title = `Chat ${new Date().toLocaleDateString()}`;
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: uuidv4(),
          title,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setConversationId(data.data.id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Track message sent (fire and forget)
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        event: 'message_sent',
        properties: { conversationId }
      })
    }).catch(console.error);

    // Create or use existing conversation
    let convId = conversationId;
    if (!convId) {
      try {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: uuidv4(),
            title: message.substring(0, 50) + '...',
          }),
        });
        const data = await response.json();
        if (data.success) {
          convId = data.data.id;
          setConversationId(convId);
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      content: message,
      role: 'user',
    };
    setMessages(prev => [...prev, userMessage]);

    // Add loading message
    const loadingMessageId = uuidv4();
    const loadingMessage: Message = {
      id: loadingMessageId,
      content: 'Thinking...',
      role: 'assistant',
    };
    setMessages(prev => [...prev, loadingMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          sessionId: sessionIdRef.current,
          conversationId: convId,
          options: {
            matchThreshold: 0.85,
            matchCount: 5,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Replace loading message with actual response
        setMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessageId 
              ? {
                  id: uuidv4(),
                  content: data.data.answer,
                  role: 'assistant' as const,
                  sources: data.data.sources,
                }
              : msg
          )
        );
      } else {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === loadingMessageId 
              ? {
                  id: uuidv4(),
                  content: `Error: ${data.error}`,
                  role: 'assistant' as const,
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => 
        prev.map(msg => 
          msg.id === loadingMessageId 
            ? {
                id: uuidv4(),
                content: 'Failed to get response. Please try again.',
                role: 'assistant' as const,
              }
            : msg
        )
      );
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const handleRegenerateResponse = useCallback(async (messageId: string) => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/chat/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          conversationId,
          sessionId: sessionIdRef.current,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? {
                  ...msg,
                  content: data.data.answer,
                  sources: data.data.sources,
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Failed to regenerate:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-40 h-full transition-all duration-300 ${
          sidebarOpen ? 'w-72' : 'w-0'
        } bg-slate-950/50 backdrop-blur-xl border-r border-slate-800/50 shadow-2xl`}
      >
        <ConversationList
          currentConversationId={conversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={() => {
            setConversationId(undefined);
            setMessages([]);
          }}
        />
      </div>

      {/* Overlay when sidebar open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed md:hidden inset-0 bg-black/60 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col relative">
        {/* Mobile header with sidebar toggle */}
        <div className="md:hidden border-b border-slate-800/50 px-4 py-3 flex items-center gap-3 bg-slate-950/80 backdrop-blur-xl">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800/60 rounded-lg transition-all duration-200 text-slate-400 hover:text-white"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-sm font-semibold text-white flex-1 truncate">{conversationTitle}</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-black/20 to-gray-900/20 mb-6 border border-gray-500/30 shadow-lg shadow-black/10">
                  <Send size={36} className="text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-black to-gray-400 bg-clip-text text-transparent">
                  Start a Conversation
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Ask me anything about your documents and knowledge base. 
                  I'll provide accurate answers based on your data.
                </p>
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isLoading={loading && msg === messages[messages.length - 1]}
                onRegenerate={msg.role === 'assistant' ? handleRegenerateResponse : undefined}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-800/50 px-4 md:px-8 py-6 bg-slate-950/30 backdrop-blur-xl">
          <ChatInput
            onSend={handleSendMessage}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
