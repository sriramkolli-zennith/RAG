'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
      <div className="inline-block p-3 bg-red-100 dark:bg-red-900 rounded-full mb-4">
        <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Authentication Error
      </h1>
      
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {error === 'Configuration' && 'There is a problem with the server configuration.'}
        {error === 'AccessDenied' && 'You do not have permission to sign in.'}
        {error === 'Verification' && 'The verification token has expired or has already been used.'}
        {!error && 'An error occurred during authentication.'}
      </p>

      <Link
        href="/auth/signin"
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
      >
        Try Again
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Suspense fallback={
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
          <div className="animate-pulse">Loading...</div>
        </div>
      }>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
