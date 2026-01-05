'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h1 className="text-xl font-bold text-gray-800">RAG Chatbase Agent</h1>
            <p className="text-xs text-gray-500">Powered by Vector DB & OpenAI</p>
          </div>
        </div>
        
        <nav className="flex items-center space-x-4">
          <Link
            href="/admin"
            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            📊 Admin
          </Link>
          <Link
            href="/docs"
            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            📖 Docs
          </Link>
        </nav>
      </div>
    </header>
  );
}
