'use client';

import { useState, useEffect } from 'react';
import DocumentUpload from '@/components/DocumentUpload';
import { Header } from '@/components/Header';

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
    fetchDocuments();
    fetchAnalytics();
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
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Admin</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your knowledge base documents</p>
          </div>
          <DocumentUpload onUploadComplete={(count) => {
            setMessage({ type: 'success', text: `Successfully uploaded ${count} documents!` });
            fetchDocuments();
          }} />
        </div>

        {/* Analytics Section */}
        {!analyticsLoading && analytics && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg shadow p-6 border border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
                Conversations ({analytics.period})
              </h3>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {analytics.conversations.total}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {analytics.conversations.perDay} per day
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg shadow p-6 border border-green-200 dark:border-green-800">
              <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                Total Messages
              </h3>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                {analytics.messages.total}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {analytics.messages.perConversation} per conversation
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg shadow p-6 border border-purple-200 dark:border-purple-800">
              <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">
                Message Breakdown
              </h3>
              <p className="text-lg font-medium text-purple-900 dark:text-purple-100">
                {analytics.messages.user} user / {analytics.messages.assistant} AI
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                User to AI ratio
              </p>
            </div>
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg mb-6 text-sm ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-900' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{message.text}</span>
              <button
                onClick={() => setMessage(null)}
                className="text-lg font-light opacity-60 hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Add Document Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Document</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Source
              </label>
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="e.g., Company FAQ"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Content
              </label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste your content here..."
                rows={5}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all resize-y"
              />
            </div>
            
            <button
              onClick={handleAddDocument}
              disabled={isAdding}
              className="px-4 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAdding ? 'Adding...' : 'Add Document'}
            </button>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents ({documents.length})
            </h2>
          </div>
          
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              No documents yet. Add one above to get started.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          {String(doc.metadata.source || 'Manual')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {doc.content}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
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
