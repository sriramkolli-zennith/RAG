'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-black border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-full mx-auto px-8 py-3">
        <div className="flex items-center justify-between">

          {/* Logo + Name → Home */}
          <Link href="/" className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-black border border-slate-700 flex items-center justify-center text-lg font-bold">
              🧠
            </div>
            <div>
              <h1 className="text-base font-semibold text-white">
                RAG Assistant
              </h1>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            <Link
              href="/admin"
              className="text-sm font-medium text-slate-400 hover:text-slate-200 px-4 py-2 rounded-md hover:bg-slate-900/80 transition-all duration-150"
            >
              Admin
            </Link>
            <Link
              href="/docs"
              className="text-sm font-medium text-slate-400 hover:text-slate-200 px-4 py-2 rounded-md hover:bg-slate-900/80 transition-all duration-150"
            >
              Docs
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
}
