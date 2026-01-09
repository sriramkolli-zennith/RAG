# Quick Setup Guide

## Current Status Check

Visit: **http://localhost:3000/api/debug/db-status**

This will show:
- ✅ If database is ready for local embeddings (384D)
- ⚠️ If migration is needed (still 1536D)
- Number of documents in database

---

## Step 1: Run Database Migration

**Copy this SQL and run it in your Supabase SQL Editor:**

```sql
-- Drop existing index
DROP INDEX IF EXISTS documents_embedding_idx;

-- Drop existing function
DROP FUNCTION IF EXISTS match_documents(vector, float, int);

-- Alter the embedding column dimension
ALTER TABLE documents 
ALTER COLUMN embedding TYPE VECTOR(384);

-- Recreate the index for the new dimension
CREATE INDEX documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Recreate the match function with new dimension
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(384),
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
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Step 2: Delete Old Documents

Old documents have 1536D embeddings which won't work with the new 384D system.

**In Supabase SQL Editor, run:**

```sql
DELETE FROM documents;
```

---

## Step 3: Upload Documents

1. Go to **http://localhost:3000/admin**
2. Upload your PDF or text files
3. Wait for processing (first upload will download the embedding model ~90MB)

---

## Step 4: Test

1. Go to **http://localhost:3000**
2. Ask a question about your documents
3. You should see sources being retrieved!

---

## Settings Updated

- **Chunk Size**: 100 characters (for more precise retrieval)
- **Chunk Overlap**: 20 characters
- **Match Threshold**: 0.3 (lowered from 0.85 for better recall)
- **Embeddings**: Local (384D) - no API costs!

---

## Troubleshooting

### "No documents found"
- Check http://localhost:3000/api/debug/db-status
- Make sure migration was run
- Verify documents are uploaded

### "Dimension mismatch"
- Run the migration SQL again
- Delete all documents
- Re-upload

### Model download fails
- Check internet connection
- Clear cache: `rm -rf ~/.cache/huggingface`
- Restart server
