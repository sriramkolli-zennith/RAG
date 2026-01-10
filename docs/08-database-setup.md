# 🗃️ Database Setup & Migrations

This document covers the Supabase database setup for the RAG Chatbase Agent.

## Prerequisites

1. Create a [Supabase](https://supabase.com) account
2. Create a new project
3. Copy your project URL and service role key

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Schema

### Tables Overview

| Table | Purpose |
|-------|---------|
| `documents` | Knowledge base with vector embeddings |
| `conversations` | Chat conversation metadata |
| `messages` | Individual chat messages |
| `chat_history` | Legacy session-based history |

## Migration Order

Run these SQL files in your Supabase SQL Editor in order:

### 1. Base Schema (`supabase/schema.sql`)

Sets up the core documents table with pgvector:

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table (knowledge base)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536),  -- Will be changed to 384 in migration 3
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector similarity index
CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Metadata search index
CREATE INDEX IF NOT EXISTS documents_metadata_idx 
ON documents USING gin (metadata);

-- Legacy chat history
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_history_session_idx 
ON chat_history (session_id, created_at);
```

### 2. Conversations (`supabase/migrations/001_create_conversations.sql`)

Adds proper conversation management:

```sql
-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_id VARCHAR(255),
  title VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archived BOOLEAN DEFAULT FALSE
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  regenerated_from UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
```

### 3. Local Embeddings (`supabase/migrations/003_switch_to_local_embeddings.sql`)

**⚠️ IMPORTANT**: This migration changes embedding dimensions from 1536 to 384. All existing documents become incompatible!

```sql
-- Drop existing index
DROP INDEX IF EXISTS documents_embedding_idx;

-- Drop existing function
DROP FUNCTION IF EXISTS match_documents(vector, float, int);
DROP FUNCTION IF EXISTS match_documents(text, float, int);

-- Change embedding dimension
ALTER TABLE documents 
ALTER COLUMN embedding TYPE VECTOR(384);

-- Recreate index
CREATE INDEX documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Recreate function with TEXT input (for easier API calls)
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

**After running this migration:**
1. Delete all existing documents: `DELETE FROM documents;`
2. Re-upload your documents through the admin panel or API

## Row Level Security (RLS)

Enable RLS for production security:

```sql
-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Documents: Allow public read
CREATE POLICY "Allow read access to documents" 
ON documents FOR SELECT 
USING (true);

-- Documents: Restrict write (customize as needed)
CREATE POLICY "Allow authenticated insert" 
ON documents FOR INSERT 
WITH CHECK (true);

-- Conversations: User access control
CREATE POLICY conversations_user_access ON conversations
FOR ALL USING (user_id IS NULL OR auth.uid()::text = user_id);

-- Messages: Access through conversations
CREATE POLICY messages_conversation_access ON messages
FOR ALL USING (
  conversation_id IN (
    SELECT id FROM conversations 
    WHERE user_id IS NULL OR auth.uid()::text = user_id
  )
);
```

## Useful SQL Queries

### Check Document Count
```sql
SELECT COUNT(*) FROM documents;
```

### Check Embedding Dimensions
```sql
SELECT 
  id,
  array_length(embedding::float[], 1) as dimensions
FROM documents
LIMIT 5;
```

### Sample Vector Search
```sql
-- Test with a manual embedding (384 zeros for testing)
SELECT * FROM match_documents(
  '[' || array_to_string(array_fill(0.0::float, ARRAY[384]), ',') || ']',
  0.0,  -- threshold
  5     -- limit
);
```

### Clear All Documents
```sql
DELETE FROM documents;
```

### Check Conversation Stats
```sql
SELECT 
  c.id,
  c.title,
  COUNT(m.id) as message_count,
  c.created_at
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
GROUP BY c.id
ORDER BY c.updated_at DESC;
```

## TypeScript Types

The database types are defined in [src/lib/supabase/database.types.ts](../src/lib/supabase/database.types.ts):

```typescript
export interface Database {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          content: string;
          metadata: Json;
          embedding: number[] | null;  // 384 dimensions
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          metadata?: Json;
          embedding?: number[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      // ... conversations, messages, chat_history
    };
    Functions: {
      match_documents: {
        Args: {
          query_embedding: string;  // Note: TEXT not number[]
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          content: string;
          metadata: Json;
          similarity: number;
        }[];
      };
    };
  };
}
```

## Troubleshooting

### "Dimension mismatch" Error

Your embeddings don't match the column dimension:
1. Check if you ran migration 003
2. Delete all old documents
3. Re-upload with new embeddings

### "Function match_documents doesn't exist"

Run the function creation SQL from schema.sql or migration 003.

### Low Similarity Scores

Local embeddings (all-MiniLM-L6-v2) produce lower scores than OpenAI:
- OpenAI: 0.7-0.95 for relevant matches
- Local: 0.2-0.5 for relevant matches
- Use threshold of 0.1-0.2 for local embeddings

### Index Not Being Used

For IVFFlat indexes, you need enough data:
- Index works best with 1000+ documents
- For small datasets, consider HNSW index instead

---

[← Previous: Vector Databases](03-vector-databases.md) | [Next: Local Embeddings →](local-embeddings.md)
