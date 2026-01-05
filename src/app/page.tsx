'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { SourcesPanel } from '@/components/SourcesPanel';
import { Header } from '@/components/Header';

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

// Generate a unique session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const [showSources, setShowSources] = useState(false);
  const [selectedSources, setSelectedSources] = useState<Message['sources']>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_response`,
        role: 'assistant',
        content: data.data.answer,
        sources: data.data.sources,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      // Add error message
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSources = (sources: Message['sources']) => {
    setSelectedSources(sources || []);
    setShowSources(true);
  };

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main chat area */}
        <main className="flex-1 flex flex-col">
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="text-6xl mb-4">🤖</div>
                <h2 className="text-xl font-semibold mb-2">Welcome to RAG Chatbase</h2>
                <p className="text-center max-w-md">
                  Ask me anything about the knowledge base. I&apos;ll search through the documents
                  and provide answers based on the most relevant information.
                </p>
              </div>
            ) : (
              messages.map(message => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onViewSources={
                    message.sources && message.sources.length > 0
                      ? () => handleViewSources(message.sources)
                      : undefined
                  }
                />
              ))
            )}
            
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500 p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                </div>
                <span>Thinking...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t bg-white p-4">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </main>

        {/* Sources panel */}
        <SourcesPanel
          sources={selectedSources || []}
          isOpen={showSources}
          onClose={() => setShowSources(false)}
        />
      </div>
    </div>
  );
}
