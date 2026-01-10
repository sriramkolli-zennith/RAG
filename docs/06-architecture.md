# 🏗️ System Architecture

This document provides a detailed technical overview of the RAG Chatbase Agent architecture.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │  ChatInterface  │  │ ConversationList│  │  DocumentUpload │                  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                  │
│           │                    │                    │                            │
└───────────┼────────────────────┼────────────────────┼────────────────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NEXT.JS API ROUTES                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  /api/chat   │  │/api/documents│  │  /api/search │  │/api/convers- │         │
│  │  /api/chat/  │  │/api/documents│  │              │  │  ations      │         │
│  │    stream    │  │   /upload    │  │              │  │              │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                 │                 │                 │                  │
└─────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CORE LIBRARIES                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         RAG ENGINE (src/lib/rag/)                        │    │
│  │  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────────┐     │    │
│  │  │   engine.ts  │  │ vector-store.ts│  │      chunking.ts         │     │    │
│  │  │ (RAG Logic)  │  │ (CRUD + Search)│  │ (Text Processing)        │     │    │
│  │  └──────────────┘  └────────────────┘  └──────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                     │                                            │
│         ┌───────────────────────────┼───────────────────────────┐               │
│         ▼                           ▼                           ▼               │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐           │
│  │ Local Embeddings│     │  OpenAI Client  │     │ Supabase Client │           │
│  │ (Transformers.js│     │ (Azure OpenAI)  │     │   (Database)    │           │
│  │ all-MiniLM-L6)  │     │  Chat Only      │     │                 │           │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SERVICES                                      │
│  ┌───────────────────────────────┐    ┌───────────────────────────────────┐    │
│  │      Supabase (PostgreSQL)    │    │         Azure OpenAI              │    │
│  │  ┌─────────────────────────┐  │    │  ┌─────────────────────────────┐  │    │
│  │  │  documents (pgvector)   │  │    │  │     Chat Completions        │  │    │
│  │  │  - id, content          │  │    │  │     (GPT-4o-mini)           │  │    │
│  │  │  - metadata (JSONB)     │  │    │  └─────────────────────────────┘  │    │
│  │  │  - embedding (384D)     │  │    │                                    │    │
│  │  └─────────────────────────┘  │    │  Note: Embeddings are LOCAL       │    │
│  │  ┌─────────────────────────┐  │    │  (Transformers.js)                │    │
│  │  │     conversations       │  │    │                                    │    │
│  │  │  - id, session_id       │  │    └───────────────────────────────────┘    │
│  │  │  - title, user_id       │  │                                              │
│  │  └─────────────────────────┘  │                                              │
│  │  ┌─────────────────────────┐  │                                              │
│  │  │       messages          │  │                                              │
│  │  │  - conversation_id      │  │                                              │
│  │  │  - role, content        │  │                                              │
│  │  │  - sources (JSONB)      │  │                                              │
│  │  └─────────────────────────┘  │                                              │
│  └───────────────────────────────┘                                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Chat Flow (RAG Pipeline)

```
┌──────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│   User   │────▶│  API Route    │────▶│  RAG Engine   │────▶│  Vector Store │
│  Query   │     │  /api/chat    │     │  engine.ts    │     │  Search       │
└──────────┘     └───────────────┘     └───────┬───────┘     └───────┬───────┘
                                               │                      │
                                               │    ┌─────────────────┘
                                               │    │
                                               ▼    ▼
                                       ┌───────────────┐
                                       │  Local        │
                                       │  Embeddings   │
                                       │  (384D)       │
                                       └───────┬───────┘
                                               │
                                               ▼
                                       ┌───────────────┐
                                       │  Supabase     │
                                       │  pgvector     │
                                       │  match_docs   │
                                       └───────┬───────┘
                                               │
                                               ▼
                                       ┌───────────────┐
                                       │  Retrieved    │
                                       │  Documents    │
                                       └───────┬───────┘
                                               │
                                               ▼
                                       ┌───────────────┐
                                       │ Azure OpenAI  │
                                       │ GPT-4o-mini   │
                                       │ + Context     │
                                       └───────┬───────┘
                                               │
                                               ▼
                                       ┌───────────────┐
                                       │   Response    │
                                       │   + Sources   │
                                       └───────────────┘
```

### Document Ingestion Flow

```
┌──────────────┐
│ File Upload  │
│ (PDF/TXT/MD) │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Text Extract │────▶│   Chunking   │
│ (pdf2json)   │     │ (1500 chars) │
└──────────────┘     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Sanitize    │
                     │  & Clean     │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Generate   │
                     │  Embeddings  │
                     │ (384D Local) │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   Store in   │
                     │   Supabase   │
                     │  (pgvector)  │
                     └──────────────┘
```

## Core Module Details

### 1. RAG Engine (`src/lib/rag/engine.ts`)

The heart of the application - orchestrates the RAG pipeline.

```typescript
// Key exports
export async function chat(
  query: string,
  sessionId: string,
  options?: ChatOptions
): Promise<ChatResponse>

export async function* streamChat(
  query: string,
  sessionId: string,
  options?: ChatOptions
): AsyncGenerator<StreamChunk>
```

**Responsibilities:**
- Coordinate retrieval and generation
- Manage conversation context
- Format prompts with retrieved documents
- Save chat history

**System Prompt:**
```
You are a helpful knowledge base assistant...
GUIDELINES:
1. Use the provided documents to answer questions accurately
2. If context contains info, use it to formulate helpful response
3. When citing information, reference document number
4. If no relevant info found, say so clearly
...
```

### 2. Vector Store (`src/lib/rag/vector-store.ts`)

Handles all vector database operations.

```typescript
// Key exports
export async function addDocument(content: string, metadata?: object): Promise<Document>
export async function addDocuments(documents: DocInput[]): Promise<Document[]>
export async function searchDocuments(query: string, threshold?: number, count?: number): Promise<SearchResult[]>
export async function deleteDocument(id: string): Promise<void>
export async function getAllDocuments(): Promise<Document[]>
```

**Search Implementation:**
```typescript
// 1. Generate query embedding (384D)
const queryEmbedding = await generateEmbedding(query);

// 2. Format as PostgreSQL vector string
const embeddingString = `[${queryEmbedding.join(',')}]`;

// 3. Call Supabase RPC function
const { data } = await supabase.rpc('match_documents', {
  query_embedding: embeddingString,
  match_threshold: 0.1,  // Lower for local embeddings
  match_count: 5,
});
```

### 3. Chunking (`src/lib/rag/chunking.ts`)

Intelligent text splitting for optimal retrieval.

```typescript
// Key exports
export function splitTextIntoChunks(text: string, options?: ChunkOptions): string[]
export function splitMarkdownIntoChunks(markdown: string, options?: ChunkOptions): string[]
export function processDocument(content: string, metadata?: object): ChunkedDocument[]
export function cleanPDFText(text: string): string
```

**Default Settings:**
```typescript
const DEFAULT_OPTIONS = {
  chunkSize: 1500,    // Characters per chunk
  chunkOverlap: 300,  // Overlap for context continuity
};
```

**Chunking Strategy:**
1. Split by paragraphs (double newlines)
2. Maintain section integrity
3. Include overlap from previous paragraphs
4. Special handling for Markdown headers

### 4. Local Embeddings (`src/lib/embeddings/local.ts`)

Free, local embedding generation using Transformers.js.

```typescript
// Model: Xenova/all-MiniLM-L6-v2
// Dimensions: 384
// Library: @xenova/transformers

export async function generateEmbedding(text: string): Promise<number[]>
export async function generateEmbeddings(texts: string[]): Promise<number[][]>
```

**Features:**
- Lazy model loading (first call ~10s, then instant)
- LRU cache with 24-hour TTL
- MD5-based cache keys
- Mean pooling + normalization

### 5. OpenAI Client (`src/lib/openai/client.ts`)

Azure OpenAI configuration for chat completions only.

```typescript
import { AzureOpenAI } from 'openai';

const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: '2024-02-01',
});

export const CHAT_MODEL = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-4o-mini';
export const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '1000');
export const TEMPERATURE = parseFloat(process.env.TEMPERATURE || '0.7');
```

## Database Schema

### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(384),  -- Local embeddings dimension
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IVFFlat index for fast similarity search
CREATE INDEX documents_embedding_idx 
ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Vector Search Function
```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding::vector(384)) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding::vector(384)) > match_threshold
  ORDER BY documents.embedding <=> query_embedding::vector(384)
  LIMIT match_count;
END;
$$;
```

### Conversations & Messages
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_id VARCHAR(255),
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  regenerated_from UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Caching Strategy

### Embedding Cache (`src/lib/cache.ts`)

LRU (Least Recently Used) cache for embeddings:

```typescript
class LRUCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private maxSize: number = 1000;
  
  set(key: string, value: T, ttlSeconds: number = 300) // 5 min default
  get(key: string): T | null
  // Automatic LRU eviction when full
}

// Embedding cache uses 24-hour TTL
embeddingCache.set(cacheKey, embedding, 86400);
```

**Benefits:**
- Avoid re-computing embeddings for same text
- Reduce model inference time
- Memory-efficient with automatic eviction

## Security Considerations

### Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow read access to documents" 
ON documents FOR SELECT USING (true);

CREATE POLICY conversations_user_access ON conversations
FOR ALL USING (user_id IS NULL OR auth.uid()::text = user_id);
```

### Input Validation (Zod)

```typescript
// src/lib/validation.ts
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().min(1),
});

export const batchUploadSchema = z.object({
  documents: z.array(
    z.object({
      content: z.string().min(10),
      source: z.string().optional(),
    })
  ).min(1).max(100),
});
```

## Performance Optimizations

1. **Parallel Processing**: Embeddings generated in parallel for batch uploads
2. **Lazy Model Loading**: Embedding model loaded on first use
3. **Connection Pooling**: Supabase client reused
4. **Batch Inserts**: Documents inserted in batches of 10
5. **LRU Caching**: Embeddings cached with 24h TTL
6. **Index Optimization**: IVFFlat for ~1M document scale

## Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Azure OpenAI (Chat only)
AZURE_OPENAI_API_KEY=xxx
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-01

# Optional
MAX_TOKENS=1000
TEMPERATURE=0.7
LOG_LEVEL=debug
```

---

[← Previous: API Reference](05-api-reference.md) | [Next: Components →](07-components.md)
