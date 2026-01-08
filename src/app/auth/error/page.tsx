'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 text-center border border-slate-700/50">
      <div className="inline-flex p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-2xl mb-4 border border-red-500/30 shadow-lg shadow-red-500/10">
        <AlertCircle size={36} className="text-red-400" />
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-3">
        Authentication Error
      </h1>
      
      <p className="text-slate-300 mb-6 leading-relaxed">
        {error === 'Configuration' && 'There is a problem with the server configuration.'}
        {error === 'AccessDenied' && 'You do not have permission to sign in.'}
        {error === 'Verification' && 'The verification token has expired or has already been used.'}
        {!error && 'An error occurred during authentication.'}
      </p>

      <Link
        href="/auth/signin"
        className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
      >
        Try Again
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl p-8 text-center border border-slate-700/50">
          <div className="animate-pulse text-slate-400">Loading...</div>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
