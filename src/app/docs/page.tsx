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
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📚 Documentation</h1>
          <p className="text-gray-600">
            Learn how RAG and Vector Databases work through these comprehensive guides.
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <h2 className="text-xl font-semibold mb-2">🚀 Quick Start</h2>
          <p className="mb-4 text-blue-100">
            Get the application running in minutes:
          </p>
          <div className="bg-blue-700/50 rounded-lg p-4 font-mono text-sm">
            <p># Install dependencies</p>
            <p>npm install</p>
            <p className="mt-2"># Set up your .env.local with API keys</p>
            <p className="mt-2"># Run the development server</p>
            <p>npm run dev</p>
          </div>
        </div>

        {/* Learning Path */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">📚 Learning Path</h2>
          <div className="space-y-4">
            {topics.map((topic, index) => (
              <div
                key={topic.file}
                className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        Part {index + 1}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {topic.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-3">{topic.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {topic.concepts.map((concept) => (
                        <span
                          key={concept}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/docs/${topic.file.replace('.md', '')}`}
                    className="ml-4 text-blue-600 hover:text-blue-700"
                  >
                    Read →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🏗️ Architecture</h2>
          <pre className="text-xs overflow-x-auto bg-white p-4 rounded-lg border">
{`┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   Next.js UI    │────▶│   API Routes     │────▶│   RAG Engine    │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────┐
                        │                                 │         │
                        ▼                                 ▼         ▼
               ┌─────────────────┐              ┌─────────────────┐
               │ Vector Search   │              │    OpenAI API   │
               │  (pgvector)     │              │   (GPT + Ada)   │
               └─────────────────┘              └─────────────────┘`}
          </pre>
        </div>

        {/* Key Concepts */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 mb-2">🧠 Key Concept: Embeddings</h3>
            <p className="text-sm text-gray-600">
              Embeddings convert text to numerical vectors that capture semantic meaning.
              Similar texts have similar embeddings, enabling semantic search.
            </p>
          </div>
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 mb-2">🔍 Key Concept: Vector Search</h3>
            <p className="text-sm text-gray-600">
              Vector databases find documents by similarity, not exact matches.
              This enables finding relevant content even with different wording.
            </p>
          </div>
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 mb-2">📄 Key Concept: Chunking</h3>
            <p className="text-sm text-gray-600">
              Large documents are split into smaller chunks for precise retrieval.
              Overlapping chunks preserve context at boundaries.
            </p>
          </div>
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-gray-800 mb-2">💬 Key Concept: Context</h3>
            <p className="text-sm text-gray-600">
              Retrieved documents are added to the LLM prompt as context,
              grounding the response in factual information.
            </p>
          </div>
        </div>

        {/* Resources */}
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">🔗 Resources</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="https://supabase.com/docs/guides/ai"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-medium text-gray-800">Supabase AI Docs</h4>
              <p className="text-sm text-gray-500">Official pgvector guide</p>
            </a>
            <a
              href="https://platform.openai.com/docs/guides/embeddings"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-medium text-gray-800">OpenAI Embeddings</h4>
              <p className="text-sm text-gray-500">Embedding API documentation</p>
            </a>
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h4 className="font-medium text-gray-800">Next.js Docs</h4>
              <p className="text-sm text-gray-500">Framework documentation</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
