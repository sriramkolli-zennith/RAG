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
 * Uses optimized batch processing with parallel embedding generation
 */
export async function addDocuments(
  documents: Array<{ content: string; metadata?: Record<string, unknown> }>
): Promise<Document[]> {
  const supabase = createServerClient();
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  const results: Document[] = [];
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    
    // Generate all embeddings in parallel for the batch
    const embeddings = await Promise.all(
      batch.map(doc => generateEmbedding(doc.content))
    );
    
    // Insert all documents in a single batch operation
    const inserts = batch.map((doc, idx) => ({
      content: doc.content,
      metadata: doc.metadata || {},
      embedding: embeddings[idx] as any,
    }));
    
    const { data, error } = (await supabase
      .from('documents')
      .insert(inserts)
      .select()) as { data: Document[] | null; error: any };
    
    if (error) {
      throw new Error(`Failed to add documents: ${error.message}`);
    }
    
    if (data) {
      results.push(...data);
    }
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
 * Note: Local embedding models (like all-MiniLM-L6-v2) produce lower
 * similarity scores than OpenAI models. Use threshold of 0.1-0.3.
 * 
 * @param query - The search query
 * @param matchThreshold - Minimum similarity score (0-1), default 0.1 for local models
 * @param matchCount - Maximum number of results
 */
export async function searchDocuments(
  query: string,
  matchThreshold: number = 0.1,
  matchCount: number = 5
): Promise<SearchResult[]> {
  const supabase = createServerClient();
  
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  console.log(`[Search] Query: "${query.substring(0, 50)}..."`);
  console.log(`[Search] Embedding dimension: ${queryEmbedding.length}`);
  console.log(`[Search] Threshold: ${matchThreshold}, Max results: ${matchCount}`);
  
  // Format embedding as PostgreSQL vector string: '[0.1, 0.2, ...]'
  const embeddingString = `[${queryEmbedding.join(',')}]`;
  
  // Call RPC function - try with explicit casting
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embeddingString,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error('[Search] Error:', error);
    throw new Error(`Search failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.log(`[Search] No documents found above threshold ${matchThreshold}`);
    
    // Debug: Check if any documents exist at all
    const { data: allDocs, error: allDocsError } = await supabase
      .from('documents')
      .select('id, embedding')
      .limit(1);
    
    if (allDocsError) {
      console.log('[Search] Error checking documents:', allDocsError);
    } else if (allDocs && allDocs.length > 0) {
      const firstDoc = allDocs[0];
      const docEmbedding = firstDoc.embedding;
      console.log(`[Search] Sample document embedding exists: ${docEmbedding ? 'Yes' : 'No'}`);
      if (docEmbedding) {
        // Check if it's an array and its length
        const embArray = Array.isArray(docEmbedding) ? docEmbedding : 
          (typeof docEmbedding === 'string' ? JSON.parse(docEmbedding) : null);
        console.log(`[Search] Document embedding length: ${embArray ? embArray.length : 'N/A'}`);
      }
    } else {
      console.log('[Search] No documents in database!');
    }
    
    return [];
  }

  console.log(`[Search] Found ${data.length} documents`);
  data.forEach((doc: any, i: number) => {
    console.log(`[Search] Doc ${i+1}: similarity=${doc.similarity?.toFixed(3)}, content="${doc.content?.substring(0, 50)}..."`);
  });

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
