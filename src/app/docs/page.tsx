import Link from 'next/link';
import { Header } from '@/components/Header';

export default function DocsPage() {
  const topics = [
    {
      title: '📖 What is RAG?',
      description: 'Learn the fundamentals of Retrieval-Augmented Generation and why it matters.',
      file: '01-what-is-rag.md',
      concepts: ['RAG Pipeline', 'Retrieval', 'Augmentation', 'Generation'],
    },
    {
      title: '🔢 Understanding Embeddings',
      description: 'How text is converted to numbers that capture semantic meaning.',
      file: '02-embeddings.md',
      concepts: ['Vectors', 'Cosine Similarity', 'Dimensions', 'OpenAI Ada'],
    },
    {
      title: '🗄️ Vector Databases',
      description: 'Store and query embeddings efficiently using specialized databases.',
      file: '03-vector-databases.md',
      concepts: ['pgvector', 'Supabase', 'Similarity Search', 'Indexing'],
    },
    {
      title: '🔄 Building the RAG Pipeline',
      description: 'Implement the complete indexing and query pipelines.',
      file: '04-rag-pipeline.md',
      concepts: ['Chunking', 'Indexing', 'Querying', 'Streaming'],
    },
    {
      title: '📡 API Reference',
      description: 'Complete documentation of all available API endpoints.',
      file: '05-api-reference.md',
      concepts: ['REST API', 'Endpoints', 'Request/Response', 'TypeScript'],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Documentation</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Learn how RAG (Retrieval-Augmented Generation) works and how this application implements it
          </p>
        </div>

        {/* How RAG Works */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">How It Works</h2>
          
          <div className="space-y-4">
            <div className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">1. Upload Documents</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You add documents to the knowledge base. Each document is split into chunks and converted to embeddings (vectors).
              </p>
            </div>

            <div className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">2. User Asks a Question</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You type a question into the chat. The question is converted to an embedding using the same model.
              </p>
            </div>

            <div className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">3. Semantic Search</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The system finds the most similar document chunks by comparing embeddings. It retrieves the top 5 most relevant chunks.
              </p>
            </div>

            <div className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">4. Add Context</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The retrieved chunks are added to the AI prompt as context, along with your question.
              </p>
            </div>

            <div className="border-l-2 border-gray-300 dark:border-gray-600 pl-4">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">5. Generate Answer</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The AI generates an answer based only on the provided context, not general knowledge. This ensures accuracy and prevents hallucinations.
              </p>
            </div>
          </div>
        </div>

        {/* System Architecture */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Flow</h2>
          <div className="space-y-3 mb-4">
            <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 p-3">
              <div className="font-mono font-medium text-gray-700 dark:text-gray-300">Chat Flow:</div>
              <div className="mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                <div>User Question → Next.js Frontend</div>
                <div className="text-gray-400">↓</div>
                <div>API Route (/api/chat) → RAG Engine</div>
                <div className="text-gray-400">↓</div>
                <div>Generate Embedding (Azure OpenAI)</div>
                <div className="text-gray-400">↓</div>
                <div>Vector Search (Supabase pgvector)</div>
                <div className="text-gray-400">↓</div>
                <div>Build Prompt with Context</div>
                <div className="text-gray-400">↓</div>
                <div>Call GPT-4o (Azure OpenAI)</div>
                <div className="text-gray-400">↓</div>
                <div>Return Answer + Sources → User</div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Concepts */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Core Concepts</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Embeddings</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Text converted to numerical vectors (numbers) that capture semantic meaning. Similar texts have vectors pointing in similar directions.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Similarity Search</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Finds documents by semantic meaning, not keywords. Uses cosine similarity to measure how close two vectors are (0-1 scale).
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Chunking</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Splits large documents into smaller pieces (2000 chars each with 400 char overlap) for better retrieval precision and context.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Context Window</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Retrieved documents + your question are added as context to the AI prompt. AI only answers based on this context.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Relevance Threshold</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Only documents with 85%+ similarity are used. This filters out loosely related results and improves answer accuracy.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">Grounding</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                AI is instructed to answer only from the provided context. Prevents hallucinations and ensures factually accurate responses.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technology Stack</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Frontend</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Next.js 14 - React Framework</li>
                <li>• TypeScript - Type Safety</li>
                <li>• Tailwind CSS - Styling</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Backend / APIs</h4>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Azure OpenAI - GPT-4o & Embeddings</li>
                <li>• Supabase - PostgreSQL Database</li>
                <li>• pgvector - Vector Storage</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Topics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Learn More</h2>
          <div className="space-y-3">
            {topics.map((topic, index) => (
              <div
                key={topic.file}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                        Part {index + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {topic.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{topic.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {topic.concepts.map((concept) => (
                        <span
                          key={concept}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/docs/${topic.file.replace('.md', '')}`}
                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
                  >
                    Read →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">External Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://supabase.com/docs/guides/ai"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Supabase AI</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">pgvector & vector docs</p>
            </a>
            <a
              href="https://learn.microsoft.com/en-us/azure/ai-services/openai/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Azure OpenAI</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">API & models guide</p>
            </a>
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Next.js Docs</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Framework reference</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
