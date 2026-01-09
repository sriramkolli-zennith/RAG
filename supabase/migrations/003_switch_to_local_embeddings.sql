-- Migration: Switch to local embeddings (384 dimensions)
-- From: Azure OpenAI text-embedding-ada-002 (1536 dimensions)
-- To: Xenova/all-MiniLM-L6-v2 (384 dimensions)

-- Drop existing index
DROP INDEX IF EXISTS documents_embedding_idx;

-- Drop existing functions (both versions)
DROP FUNCTION IF EXISTS match_documents(vector, float, int);
DROP FUNCTION IF EXISTS match_documents(text, float, int);

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

-- Note: This migration will invalidate all existing embeddings.
-- You'll need to re-upload documents after running this migration.
