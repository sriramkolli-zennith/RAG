-- =====================================================
-- Supabase Database Schema for RAG Chatbase Agent
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable the pgvector extension for vector similarity search
-- This is the core of our vector database functionality
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- Documents Table
-- Stores the knowledge base documents with their embeddings
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,                    -- The actual text content
  metadata JSONB DEFAULT '{}',              -- Additional metadata (source, title, etc.)
  embedding VECTOR(1536),                   -- Azure OpenAI text-embedding-ada-002 produces 1536-dimensional vectors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster vector similarity searches
-- IVFFlat is an approximate nearest neighbor (ANN) index
-- Lists = 100 is good for up to ~1M documents
CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for metadata searches
CREATE INDEX IF NOT EXISTS documents_metadata_idx 
ON documents 
USING gin (metadata);

-- =====================================================
-- Chat History Table
-- Stores conversation history for context
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,                 -- Groups messages by conversation
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fetching chat history by session
CREATE INDEX IF NOT EXISTS chat_history_session_idx 
ON chat_history (session_id, created_at);

-- =====================================================
-- Vector Similarity Search Function
-- This function finds documents similar to a query embedding
-- =====================================================
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
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

-- =====================================================
-- Row Level Security (RLS) Policies
-- Enable RLS for production security
-- =====================================================

-- Enable RLS on tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Allow read access to documents for all authenticated users
CREATE POLICY "Allow read access to documents" 
ON documents FOR SELECT 
USING (true);

-- Allow all operations on chat_history (customize based on your auth needs)
CREATE POLICY "Allow all on chat_history" 
ON chat_history FOR ALL 
USING (true);

-- =====================================================
-- Trigger for updating updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
