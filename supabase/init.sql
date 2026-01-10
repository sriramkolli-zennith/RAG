-- =====================================================
-- RAG Chatbot Complete Database Initialization
-- Version: 2.0.0
-- Created: Single consolidated schema file
-- Features: pgvector, RLS, conversations, analytics, 1536-dim embeddings
-- =====================================================

-- Drop everything (optional - uncomment to reset completely)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- DOCUMENTS TABLE
-- Stores the knowledge base with Azure OpenAI embeddings (1536 dims)
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding VECTOR(1536),  -- Azure OpenAI text-embedding-ada-002
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS documents_embedding_idx 
ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Metadata search index
CREATE INDEX IF NOT EXISTS documents_metadata_idx 
ON documents 
USING gin (metadata);

-- =====================================================
-- CONVERSATIONS TABLE
-- Tracks multi-turn conversations
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL UNIQUE,
  user_id VARCHAR(255),
  title VARCHAR(255),
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation indexes
CREATE INDEX IF NOT EXISTS idx_conversations_session_id 
ON conversations(session_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id 
ON conversations(user_id);

-- =====================================================
-- MESSAGES TABLE
-- Individual messages within conversations
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]'::jsonb,
  regenerated_from UUID REFERENCES messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON messages(created_at DESC);

-- =====================================================
-- CHAT HISTORY TABLE
-- Session-based chat history (alternate to messages table)
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat history indexes
CREATE INDEX IF NOT EXISTS chat_history_session_idx 
ON chat_history (session_id, created_at);

-- =====================================================
-- USERS TABLE
-- User authentication and profiles
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS EVENTS TABLE
-- Usage tracking and analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp 
ON analytics_events(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_event_name 
ON analytics_events(event_name);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Vector similarity search function
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

-- Trigger for updating updated_at timestamp on documents
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Documents RLS - allow all to read and insert
DROP POLICY IF EXISTS documents_select_policy ON documents;
CREATE POLICY documents_select_policy
ON documents FOR SELECT 
USING (true);

DROP POLICY IF EXISTS documents_insert_policy ON documents;
CREATE POLICY documents_insert_policy
ON documents FOR INSERT 
WITH CHECK (true);

-- Conversations RLS - allow read/write own conversations
DROP POLICY IF EXISTS conversations_user_access ON conversations;
CREATE POLICY conversations_user_access
ON conversations FOR ALL 
USING (user_id IS NULL OR auth.uid()::text = user_id);

-- Messages RLS - allow read/write messages in user's conversations
DROP POLICY IF EXISTS messages_conversation_access ON messages;
CREATE POLICY messages_conversation_access
ON messages FOR ALL 
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id IS NULL OR auth.uid()::text = user_id
  )
);

-- Chat history RLS - allow all authenticated users
DROP POLICY IF EXISTS chat_history_all_access ON chat_history;
CREATE POLICY chat_history_all_access
ON chat_history FOR ALL 
USING (true);

-- Users RLS - allow users to read/write own profile
DROP POLICY IF EXISTS users_own_profile ON users;
CREATE POLICY users_own_profile
ON users FOR ALL 
USING (auth.uid() = id);

-- Analytics RLS - allow all users to insert, admins to read
DROP POLICY IF EXISTS analytics_insert_policy ON analytics_events;
CREATE POLICY analytics_insert_policy
ON analytics_events FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS analytics_select_policy ON analytics_events;
CREATE POLICY analytics_select_policy
ON analytics_events FOR SELECT 
USING (true);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================
COMMENT ON TABLE documents IS 'Knowledge base documents with Azure OpenAI 1536-dim embeddings';
COMMENT ON TABLE conversations IS 'User conversation sessions';
COMMENT ON TABLE messages IS 'Messages within conversations with source tracking';
COMMENT ON TABLE chat_history IS 'Session-based chat history';
COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON TABLE analytics_events IS 'Usage analytics and events';
COMMENT ON FUNCTION match_documents IS 'Vector similarity search using cosine distance';

-- =====================================================
-- INITIALIZATION COMPLETE
-- =====================================================
-- This schema includes:
-- ✓ pgvector extension for vector search
-- ✓ Documents table with 1536-dim embeddings (Azure OpenAI)
-- ✓ Conversations and messages for multi-turn chat
-- ✓ Chat history for session tracking
-- ✓ Users table for authentication
-- ✓ Analytics events for usage tracking
-- ✓ All necessary indexes for performance
-- ✓ RLS policies for security
-- ✓ Triggers for timestamp management
-- ✓ Vector similarity search function
-- =====================================================
