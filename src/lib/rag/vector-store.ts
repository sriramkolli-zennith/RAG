import { createServerClient } from '../supabase/client';
import { generateEmbedding } from '../openai/embeddings';
import { Document, DocumentInsert } from '../supabase/database.types';

/**
 * Vector Store Service
 * 
 * This service manages the vector database operations:
 * - Storing documents with their embeddings
 * - Performing semantic similarity search
 * - Managing the knowledge base
 * 
 * The vector store is the foundation of RAG - it enables finding
 * relevant documents based on meaning, not just keywords.
 */

export interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

/**
 * Add a document to the vector store
 * 
 * This function:
 * 1. Generates an embedding for the document content
 * 2. Stores both the content and embedding in Supabase
 * 
 * @param content - The text content to store
 * @param metadata - Optional metadata (source, title, etc.)
 */
export async function addDocument(
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<Document> {
  const supabase = createServerClient();
  
  // Generate embedding for the content
  const embedding = await generateEmbedding(content);
  
  // Store in Supabase
  const { data, error } = (await supabase
    .from('documents')
    .insert({
      content,
      metadata: metadata as any,
      embedding: embedding as any,
    })
    .select()
    .single()) as { data: Document | null; error: any };

  if (error) {
    throw new Error(`Failed to add document: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data returned from insert');
  }

  return data;
}

/**
 * Add multiple documents to the vector store
 * Uses batch processing for efficiency
 */
export async function addDocuments(
  documents: Array<{ content: string; metadata?: Record<string, unknown> }>
): Promise<Document[]> {
  const results: Document[] = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(doc => addDocument(doc.content, doc.metadata || {}))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Search for similar documents using semantic search
 * 
 * This is the core of the retrieval step in RAG:
 * 1. Convert the query to an embedding
 * 2. Find documents with similar embeddings using cosine similarity
 * 3. Return the most relevant documents
 * 
 * @param query - The search query
 * @param matchThreshold - Minimum similarity score (0-1)
 * @param matchCount - Maximum number of results
 */
export async function searchDocuments(
  query: string,
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<SearchResult[]> {
  const supabase = createServerClient();
  
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  // Call the PostgreSQL function for vector similarity search
  const result: any = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding as any,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });
  
  const { data, error } = result;

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  if (!data) {
    return [];
  }

  return data.map((doc: any) => ({
    id: doc.id,
    content: doc.content,
    metadata: doc.metadata || {},
    similarity: doc.similarity,
  }));
}

/**
 * Delete a document from the vector store
 */
export async function deleteDocument(id: string): Promise<void> {
  const supabase = createServerClient();
  
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

/**
 * Get all documents (for admin purposes)
 */
export async function getAllDocuments(): Promise<Document[]> {
  const supabase = createServerClient();
  
  const { data, error }: any = await supabase
    .from('documents')
    .select('id, content, metadata, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get documents: ${error.message}`);
  }

  return data || [];
}
