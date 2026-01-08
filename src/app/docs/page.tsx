import Link from 'next/link';

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
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Documentation
          </h1>
          <p className="text-base text-slate-400 leading-relaxed max-w-3xl">
            Learn how RAG (Retrieval-Augmented Generation) works and how this application implements it
          </p>
        </div>

        {/* How RAG Works */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-white mb-6">How It Works</h2>
          
          <div className="space-y-5">
            <div className="border-l-4 border-blue-500 pl-5 py-1">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">1</span>
                Upload Documents
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                You add documents to the knowledge base. Each document is split into chunks and converted to embeddings (vectors).
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-5 py-1">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs font-bold border border-purple-500/30">2</span>
                User Asks a Question
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                You type a question into the chat. The question is converted to an embedding using the same model.
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-5 py-1">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">3</span>
                Semantic Search
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                The system finds the most similar document chunks by comparing embeddings. It retrieves the top 5 most relevant chunks.
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-5 py-1">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold border border-yellow-500/30">4</span>
                Add Context
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                The retrieved chunks are added to the AI prompt as context, along with your question.
              </p>
            </div>

            <div className="border-l-4 border-pink-500 pl-5 py-1">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 text-xs font-bold border border-pink-500/30">5</span>
                Generate Answer
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                The AI generates an answer based only on the provided context, not general knowledge. This ensures accuracy and prevents hallucinations.
              </p>
            </div>
          </div>
        </div>

        {/* System Architecture */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-white mb-6">System Flow</h2>
          <div className="space-y-3 mb-4">
            <div className="text-xs text-slate-300 bg-slate-800/60 rounded-xl border border-slate-700/50 p-5">
              <div className="font-mono font-semibold text-blue-400 mb-3 text-sm">Chat Flow:</div>
              <div className="mt-2 space-y-2 text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">→</span> User Question → Next.js Frontend
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">→</span> API Route (/api/chat) → RAG Engine
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">→</span> Generate Embedding (Azure OpenAI)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">→</span> Vector Search (Supabase pgvector)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">→</span> Build Prompt with Context
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">→</span> Call GPT-4o (Azure OpenAI)
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">→</span> Return Answer + Sources → User
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Concepts */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Core Concepts</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/10">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="text-blue-400">●</span> Embeddings
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Text converted to numerical vectors (numbers) that capture semantic meaning. Similar texts have vectors pointing in similar directions.
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-purple-500/10">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="text-purple-400">●</span> Similarity Search
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Finds documents by semantic meaning, not keywords. Uses cosine similarity to measure how close two vectors are (0-1 scale).
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-green-500/50 transition-all duration-300 shadow-lg hover:shadow-green-500/10">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="text-green-400">●</span> Chunking
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Splits large documents into smaller pieces (2000 chars each with 400 char overlap) for better retrieval precision and context.
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-yellow-500/50 transition-all duration-300 shadow-lg hover:shadow-yellow-500/10">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="text-yellow-400">●</span> Context Window
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Retrieved documents + your question are added as context to the AI prompt. AI only answers based on this context.
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-pink-500/50 transition-all duration-300 shadow-lg hover:shadow-pink-500/10">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="text-pink-400">●</span> Relevance Threshold
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Only documents with 85%+ similarity are used. This filters out loosely related results and improves answer accuracy.
              </p>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-orange-500/50 transition-all duration-300 shadow-lg hover:shadow-orange-500/10">
              <h3 className="font-semibold text-white text-base mb-2 flex items-center gap-2">
                <span className="text-orange-400">●</span> Grounding
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                AI is instructed to answer only from the provided context. Prevents hallucinations and ensures factually accurate responses.
              </p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8 mb-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-white mb-6">Technology Stack</h2>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-blue-400 mb-3 text-base">Frontend</h4>
              <ul className="text-sm text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">▹</span> Next.js 14 - React Framework
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">▹</span> TypeScript - Type Safety
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">▹</span> Tailwind CSS - Styling
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-purple-400 mb-3 text-base">Backend / APIs</h4>
              <ul className="text-sm text-slate-300 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">▹</span> Azure OpenAI - GPT-4o & Embeddings
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">▹</span> Supabase - PostgreSQL Database
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">▹</span> pgvector - Vector Storage
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Topics */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Learn More</h2>
          <div className="space-y-4">
            {topics.map((topic, index) => (
              <div
                key={topic.file}
                className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/10"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30">
                        Part {index + 1}
                      </span>
                      <h3 className="text-base font-semibold text-white">
                        {topic.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-300 mb-3 leading-relaxed">{topic.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {topic.concepts.map((concept) => (
                        <span
                          key={concept}
                          className="text-xs bg-slate-800/60 text-slate-400 px-2.5 py-1 rounded-lg border border-slate-700/50"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link
                    href={`/docs/${topic.file.replace('.md', '')}`}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0 px-4 py-2 rounded-lg border border-blue-500/30 hover:border-blue-500/50 hover:bg-blue-500/10"
                  >
                    Read →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="border-t border-slate-700/50 pt-8">
          <h2 className="text-2xl font-semibold text-white mb-6">External Resources</h2>
          <div className="grid md:grid-cols-3 gap-5">
            <a
              href="https://supabase.com/docs/guides/ai"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-green-500/50 transition-all duration-300 shadow-lg hover:shadow-green-500/10 group"
            >
              <h4 className="font-semibold text-white text-base mb-2 group-hover:text-green-400 transition-colors">Supabase AI</h4>
              <p className="text-sm text-slate-400">pgvector & vector docs</p>
            </a>
            <a
              href="https://learn.microsoft.com/en-us/azure/ai-services/openai/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-blue-500/50 transition-all duration-300 shadow-lg hover:shadow-blue-500/10 group"
            >
              <h4 className="font-semibold text-white text-base mb-2 group-hover:text-blue-400 transition-colors">Azure OpenAI</h4>
              <p className="text-sm text-slate-400">API & models guide</p>
            </a>
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900/60 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 group"
            >
              <h4 className="font-semibold text-white text-base mb-2 group-hover:text-purple-400 transition-colors">Next.js Docs</h4>
              <p className="text-sm text-slate-400">Framework reference</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
