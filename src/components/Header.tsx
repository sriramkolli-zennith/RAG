'use client';

import Link from 'next/link';
import { Sparkles, Shield, BookOpen } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50 shadow-2xl shadow-black/20">
      <div className="max-w-full mx-auto px-6 py-4">
        <div className="flex items-center justify-between">

          {/* Logo + Name → Home */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-black to-gray-900 flex items-center justify-center text-xl font-bold shadow-lg shadow-black/30 group-hover:shadow-black/50 transition-all duration-300 group-hover:scale-105">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white group-hover:text-gray-400 transition-colors">
                RAG Assistant
              </h1>
              <p className="text-[10px] text-slate-400 -mt-0.5">Intelligent Knowledge Base</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800/60 transition-all duration-200 group"
            >
              <Shield className="w-4 h-4 group-hover:text-purple-400 transition-colors" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
            <Link
              href="/docs"
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800/60 transition-all duration-200 group"
            >
              <BookOpen className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
              <span className="hidden sm:inline">Docs</span>
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}
