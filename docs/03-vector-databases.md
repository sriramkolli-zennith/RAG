# 🗄️ Vector Databases Explained

## What is a Vector Database?

A **vector database** is a specialized database designed to store, index, and query high-dimensional vectors (embeddings). Unlike traditional databases that search by exact matches, vector databases find items that are *similar* to a query.

## Traditional DB vs Vector DB

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL DATABASE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Query: SELECT * FROM products WHERE name = 'laptop'                    │
│                                                                         │
│  ✅ Finds: "laptop"                                                     │
│  ❌ Misses: "notebook computer", "MacBook", "portable PC"               │
│                                                                         │
│  (Exact match only)                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      VECTOR DATABASE                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Query: "laptop" → [0.2, 0.8, 0.1, ...] (embedding)                    │
│                                                                         │
│  ✅ Finds: "laptop" (similarity: 0.99)                                  │
│  ✅ Finds: "notebook computer" (similarity: 0.94)                       │
│  ✅ Finds: "MacBook Pro" (similarity: 0.91)                             │
│  ✅ Finds: "portable PC" (similarity: 0.87)                             │
│                                                                         │
│  (Semantic similarity)                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## How Vector Search Works

### 1. Store Phase
Each document is converted to a vector and stored:

```
Document: "Machine learning is a subset of AI"
    ↓ (embedding)
Vector: [0.1, 0.3, 0.8, 0.2, ...]
    ↓ (store)
Vector Database
```

### 2. Query Phase
The query is also converted to a vector, then compared:

```
Query: "What is ML?"
    ↓ (embedding)
Query Vector: [0.2, 0.4, 0.7, 0.1, ...]
    ↓ (similarity search)
Find nearest neighbors in vector space
```

### 3. Return Results
Return documents with highest similarity scores:

```
Results:
1. "Machine learning is a subset of AI" (0.92)
2. "ML algorithms learn from data" (0.88)
3. "Deep learning is a type of ML" (0.85)
```

## Similarity Metrics

Vector databases support different ways to measure similarity:

### Cosine Similarity
Measures the angle between vectors. Best for text embeddings.

```
similarity = cos(θ) = (A · B) / (||A|| × ||B||)
```

### Euclidean Distance (L2)
Measures straight-line distance. Good when magnitude matters.

```
distance = √[(x₁-x₂)² + (y₁-y₂)² + ...]
```

### Dot Product
Simply multiplies corresponding elements. Fast but requires normalized vectors.

```
similarity = A · B = Σ(aᵢ × bᵢ)
```

## Vector Database Options

| Database | Type | Best For | Pricing |
|----------|------|----------|---------|
| **pgvector** | PostgreSQL extension | Existing Postgres users | Free |
| **Supabase** | Hosted PostgreSQL + pgvector | Full-stack apps | Free tier |
| **Pinecone** | Managed service | Production scale | Pay-as-you-go |
| **Weaviate** | Open source | Self-hosted | Free |
| **Milvus** | Open source | Large scale | Free |
| **Chroma** | Open source | Local development | Free |
| **Qdrant** | Open source | Production | Free |

## Why We Use Supabase + pgvector

For this project, we use **Supabase** with the **pgvector** extension:

### Advantages:
1. **All-in-one**: Database, auth, storage in one place
2. **SQL Power**: Full PostgreSQL features + vector search
3. **Free tier**: Generous for learning and small projects
4. **Real-time**: Built-in subscriptions for live updates
5. **Familiar**: Standard SQL syntax

## Setting Up pgvector in Supabase

### 1. Enable the Extension

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

### 2. Create a Table with Vector Column

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(384),  -- Matches local all-MiniLM-L6-v2 dimensions
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Note**: We use 384 dimensions for local Transformers.js embeddings. If using OpenAI, use 1536.

### 3. Create a Similarity Search Function

```sql
-- Our actual function (from migrations/003_switch_to_local_embeddings.sql)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding TEXT,        -- Receives string like '[0.1, 0.2, ...]'
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

**Key points:**
- `<=>` is the cosine distance operator
- `1 - distance` converts to similarity (0-1)
- Text input is cast to vector with explicit dimensions

### 4. Create an Index for Performance

```sql
-- IVFFlat index for approximate nearest neighbor search
CREATE INDEX documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## Understanding Vector Indexes

Without an index, every search compares against ALL vectors. Indexes make this faster:

### IVFFlat (Inverted File Flat)
- Clusters vectors into groups
- Only searches relevant clusters
- Good for up to ~1M vectors

```sql
CREATE INDEX ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- Number of clusters
```

### HNSW (Hierarchical Navigable Small World)
- Creates a graph structure
- Very fast queries
- Higher memory usage

```sql
CREATE INDEX ON documents 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### When to Use Which?

| Index | Build Time | Query Time | Accuracy | Memory |
|-------|------------|------------|----------|--------|
| None (exact) | - | Slow | 100% | Low |
| IVFFlat | Fast | Medium | ~95% | Medium |
| HNSW | Slow | Fast | ~99% | High |

## Querying the Vector Database

### From TypeScript/JavaScript

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

async function searchDocuments(query: string) {
  // 1. Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);
  
  // 2. Call the search function
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 5,
  });
  
  return data;
}
```

### Direct SQL

```sql
-- Find top 5 similar documents
SELECT 
  id,
  content,
  1 - (embedding <=> query_embedding) AS similarity
FROM documents
WHERE 1 - (embedding <=> query_embedding) > 0.7
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

## Operators in pgvector

| Operator | Meaning | Usage |
|----------|---------|-------|
| `<=>` | Cosine distance | `ORDER BY embedding <=> query_embedding` |
| `<->` | Euclidean distance | `ORDER BY embedding <-> query_embedding` |
| `<#>` | Negative inner product | `ORDER BY embedding <#> query_embedding` |

Note: Distance ≠ Similarity. For cosine: `similarity = 1 - distance`

## Best Practices

### 1. Choose the Right Dimensions
Match your embedding model's output:
- OpenAI ada-002: 1536
- OpenAI 3-large: 3072
- Cohere: 1024

### 2. Use Appropriate Thresholds
```
0.9+ : Very similar (near duplicates)
0.8+ : Highly relevant
0.7+ : Relevant (good default)
0.5+ : Somewhat related
```

### 3. Limit Results
Always set a reasonable limit:
```sql
LIMIT 5  -- Top 5 is usually enough for RAG
```

### 4. Combine with Filters
You can combine vector search with traditional filters:
```sql
SELECT *
FROM documents
WHERE 
  metadata->>'category' = 'technical'  -- Traditional filter
  AND 1 - (embedding <=> query_embedding) > 0.7  -- Vector filter
ORDER BY embedding <=> query_embedding
LIMIT 5;
```

## Scaling Considerations

| Documents | Recommendation |
|-----------|----------------|
| < 10,000 | Exact search (no index needed) |
| 10K - 100K | IVFFlat index |
| 100K - 1M | IVFFlat or HNSW |
| > 1M | Dedicated vector DB (Pinecone, Milvus) |

## In Our Project

The vector store is in [src/lib/rag/vector-store.ts](../src/lib/rag/vector-store.ts):

```typescript
// Add a document
await addDocument(content, { source: 'manual' });

// Search for similar documents (threshold 0.1 for local embeddings)
const results = await searchDocuments(query, 0.1, 5);
```

## Key Takeaways

1. **Vector DBs find similar, not exact** - Perfect for semantic search
2. **pgvector** - Free PostgreSQL extension for vector operations
3. **Indexes matter** - IVFFlat or HNSW for large datasets
4. **Cosine distance** - Default for text embeddings
5. **Thresholds** - Use 0.1-0.3 for local embeddings (lower scores than OpenAI)
6. **Our setup** - Supabase + pgvector with 384-dimension vectors

---

[← Previous: Embeddings](02-embeddings.md) | [Next: RAG Pipeline →](04-rag-pipeline.md)
