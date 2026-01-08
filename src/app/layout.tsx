import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'RAG Assistant - Intelligent Knowledge Base',
  description: 'AI-powered chatbot with advanced RAG (Retrieval-Augmented Generation) using Vector DB and semantic search',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
