'use client';

import { useState, useEffect } from 'react';
import DocumentUpload from '@/components/DocumentUpload';

interface Document {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export default function AdminPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);  const [newContent, setNewContent] = useState('');
  const [newSource, setNewSource] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch documents on mount
  useEffect(() => {
    // Load both in parallel
    Promise.all([fetchDocuments(), fetchAnalytics()]);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics?days=7');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async () => {
    if (!newContent.trim()) {
      setMessage({ type: 'error', text: 'Content is required' });
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          metadata: { source: newSource || 'Manual entry' },
          chunk: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        setNewContent('');
        setNewSource('');
        fetchDocuments();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add document' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Document deleted' });
        fetchDocuments();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete document' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-400">Manage your knowledge base and monitor analytics</p>
          </div>
          <DocumentUpload onUploadComplete={(count) => {
            setMessage({ type: 'success', text: `Successfully uploaded ${count} documents!` });
            fetchDocuments();
          }} />
        </div>

        {/* Analytics Section */}
        {!analyticsLoading && analytics && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-black/20 to-gray-900/20 rounded-xl shadow-xl p-6 border border-gray-500/30 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Conversations ({analytics.period})
              </h3>
              <p className="text-4xl font-bold text-white mb-2">
                {analytics.conversations.total}
              </p>
              <p className="text-sm text-blue-300">
                {analytics.conversations.perDay} per day average
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-600/20 to-green-700/20 rounded-xl shadow-xl p-6 border border-green-500/30 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Total Messages
              </h3>
              <p className="text-4xl font-bold text-white mb-2">
                {analytics.messages.total}
              </p>
              <p className="text-sm text-green-300">
                {analytics.messages.perConversation} per conversation
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/20 rounded-xl shadow-xl p-6 border border-purple-500/30 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                Message Breakdown
              </h3>
              <p className="text-2xl font-semibold text-white mb-2">
                {analytics.messages.user} user / {analytics.messages.assistant} AI
              </p>
              <p className="text-sm text-purple-300">
                User to AI ratio
              </p>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm backdrop-blur-sm ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30 shadow-lg shadow-green-500/10' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="text-xl font-light opacity-60 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Add Document Form */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6 shadow-xl">
          <h2 className="text-xl font-semibold text-white mb-4">Add Document</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Source
              </label>
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="e.g., Company FAQ"
                className="w-full px-4 py-2.5 text-sm border border-slate-700/50 rounded-lg bg-slate-800/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                suppressHydrationWarning
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Content
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste your content here..."
                rows={5}
                className="w-full px-4 py-2.5 text-sm border border-slate-700/50 rounded-lg bg-slate-800/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-y"
                suppressHydrationWarning
              />
            </div>
            
            <button
              onClick={handleAddDocument}
              disabled={isAdding}
              className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-black to-gray-900 text-white rounded-lg hover:from-gray-900 hover:to-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-black/30"
            >
              {isAdding ? 'Adding...' : 'Add Document'}
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white">
              Documents ({documents.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No documents yet. Add one above to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/30">
                          {String(doc.metadata.source || 'Manual')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                        {doc.content}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-all flex-shrink-0 border border-transparent hover:border-red-500/30"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
