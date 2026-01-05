# RAG Chatbase Agent 🤖

A production-ready RAG (Retrieval-Augmented Generation) chatbot built with Next.js, Supabase, and OpenAI. This project serves as both a functional application and an educational resource for learning RAG and vector database concepts.

![RAG Architecture](docs/images/rag-architecture.png)

## 🎯 What You'll Learn

- **RAG (Retrieval-Augmented Generation)**: How to enhance LLM responses with external knowledge
- **Vector Databases**: Storing and querying high-dimensional embeddings
- **Embeddings**: Converting text to numerical representations
- **Semantic Search**: Finding relevant documents by meaning, not keywords
- **Full-Stack Development**: Building with Next.js, TypeScript, and Supabase

## 🏗️ Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│                 │     │                  │     │                 │
│   Next.js UI    │────▶│   API Routes     │────▶│   RAG Engine    │
│                 │     │                  │     │                 │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────────────────────┐
                        │                                 │                                 │
                        ▼                                 ▼                                 ▼
               ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
               │                 │              │                 │              │                 │
               │ Vector Search   │              │   Supabase DB   │              │    OpenAI API   │
               │  (pgvector)     │              │  (PostgreSQL)   │              │   (GPT + Ada)   │
               │                 │              │                 │              │                 │
               └─────────────────┘              └─────────────────┘              └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier works)
- OpenAI API key

### 1. Clone and Install

```bash
cd RAG
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Copy your project URL and keys from Settings > API

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

### 4. Seed the Knowledge Base

```bash
npm run seed
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📁 Project Structure

```
RAG/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API Routes
│   │   │   ├── chat/           # Chat endpoint
│   │   │   ├── documents/      # Document management
│   │   │   └── search/         # Semantic search
│   │   ├── admin/              # Admin dashboard
│   │   └── page.tsx            # Main chat interface
│   │
│   ├── components/             # React components
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── SourcesPanel.tsx
│   │   └── Header.tsx
│   │
│   └── lib/                    # Core libraries
│       ├── openai/             # OpenAI integration
│       │   ├── client.ts       # OpenAI client
│       │   └── embeddings.ts   # Embedding generation
│       │
│       ├── rag/                # RAG engine
│       │   ├── engine.ts       # Main RAG logic
│       │   ├── vector-store.ts # Vector operations
│       │   ├── chunking.ts     # Text chunking
│       │   └── index.ts        # Exports
│       │
│       └── supabase/           # Database
│           ├── client.ts       # Supabase client
│           └── database.types.ts
│
├── scripts/
│   └── seed-knowledge-base.ts  # Database seeding
│
├── supabase/
│   └── schema.sql              # Database schema
│
├── docs/                       # Documentation
│   └── *.md                    # Learning guides
│
└── package.json
```

## 🧠 How It Works

See the [complete documentation](docs/01-what-is-rag.md) for detailed explanations:

1. [What is RAG?](docs/01-what-is-rag.md)
2. [Understanding Embeddings](docs/02-embeddings.md)
3. [Vector Databases Explained](docs/03-vector-databases.md)
4. [Building the RAG Pipeline](docs/04-rag-pipeline.md)
5. [API Reference](docs/05-api-reference.md)

## 🔌 API Endpoints

### POST /api/chat
Send a message and get a RAG-powered response.

```typescript
// Request
{
  "message": "What is RAG?",
  "sessionId": "unique-session-id"
}

// Response
{
  "success": true,
  "data": {
    "answer": "RAG (Retrieval-Augmented Generation) is...",
    "sources": [{ "content": "...", "similarity": 0.92 }]
  }
}
```

### POST /api/documents
Add a document to the knowledge base.

```typescript
// Request
{
  "content": "Your document content...",
  "metadata": { "source": "Manual" },
  "chunk": true
}
```

### POST /api/search
Semantic search the knowledge base.

```typescript
// Request
{
  "query": "vector similarity",
  "matchThreshold": 0.7,
  "matchCount": 5
}
```

## 🎓 Learning Path

Start with these concepts in order:

1. **Embeddings** - Understand how text becomes numbers
2. **Vector Similarity** - Learn cosine similarity
3. **Vector Databases** - Store and query embeddings
4. **RAG Pipeline** - Combine retrieval with generation
5. **Chunking** - Split documents effectively

## 🛠️ Customization

### Add Your Own Knowledge Base

1. Go to `/admin` in the browser
2. Add documents with content and source
3. Documents are automatically chunked and embedded

### Adjust RAG Parameters

Edit `src/lib/rag/engine.ts`:

```typescript
// Adjust similarity threshold (higher = stricter matching)
const matchThreshold = 0.7;

// Number of documents to retrieve
const matchCount = 5;

// LLM temperature (lower = more deterministic)
const TEMPERATURE = 0.7;
```

## 📚 Technologies Used

| Technology | Purpose |
|------------|---------|
| **Next.js 14** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Supabase** | PostgreSQL database + Auth |
| **pgvector** | Vector similarity search |
| **OpenAI** | Embeddings + Chat completions |
| **Tailwind CSS** | Styling |

## 🤝 Contributing

Contributions are welcome! Please read the documentation first to understand the architecture.

## 📄 License

MIT License - feel free to use this for learning and production.

---

Built with 💙 for learning RAG and Vector Databases
