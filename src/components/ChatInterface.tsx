'use client';

import { useState, useEffect, useRef } from 'react';
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
  const [sessionId] = useState(() => uuidv4());
  const [conversationId, setConversationId] = useState<string>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversationTitle, setConversationTitle] = useState('New Chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation messages
  const loadConversationMessages = async (convId: string) => {
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
  };

  const handleSelectConversation = (convId: string) => {
    setConversationId(convId);
    loadConversationMessages(convId);
  };

  const handleNewConversation = async () => {
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
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Track message sent
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
    const loadingMessage: Message = {
      id: uuidv4(),
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
          sessionId,
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
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            id: uuidv4(),
            content: data.data.answer,
            role: 'assistant',
            sources: data.data.sources,
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev.slice(0, -1),
          {
            id: uuidv4(),
            content: `Error: ${data.error}`,
            role: 'assistant',
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [
        ...prev.slice(0, -1),
        {
          id: uuidv4(),
          content: 'Failed to get response. Please try again.',
          role: 'assistant',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateResponse = async (messageId: string) => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/chat/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          conversationId,
          sessionId,
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
  };

  return (
    <div className="flex h-[calc(100vh-60px)] bg-black">
      {/* Sidebar */}
      <div
        className={`fixed md:relative z-40 h-full transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-slate-950 border-r border-slate-800 shadow-2xl`}
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
          className="fixed md:hidden inset-0 bg-black/40 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-black relative">
        {/* Mobile header with sidebar toggle */}
        <div className="md:hidden border-b border-slate-800 px-4 py-3 flex items-center gap-2 bg-black">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-900 rounded-lg transition-all duration-200 text-slate-400 hover:text-white"
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-sm font-semibold text-white flex-1">{conversationTitle}</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 mb-6 border border-slate-800">
                  <Send size={32} className="text-slate-600" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Start a Conversation</h2>
                <p className="text-slate-500 max-w-sm text-sm">Ask me anything about your documents and knowledge base</p>
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
        <div className="border-t border-slate-800 px-4 md:px-8 py-6 bg-black shadow-lg">
          <ChatInput
            onSend={handleSendMessage}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
