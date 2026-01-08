import openai, { EMBEDDING_MODEL } from './client';
import { embeddingCache } from '../cache';
import crypto from 'crypto';

/**
 * Embedding Service
 *
 * This service handles the conversion of text to vector embeddings.
 * Embeddings are numerical representations of text that capture semantic meaning.
 *
 * Key Concept: Text with similar meanings will have embeddings that are
 * close together in vector space, enabling semantic search.
 */

/**
 * Generate a cache key for text
 */
function getCacheKey(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Generate an embedding vector for a single piece of text
 * Now with caching to avoid redundant API calls
 *
 * @param text - The text to convert to an embedding
 * @returns A 1536-dimensional vector representing the text's semantic meaning
 *
 * How it works:
 * 1. Check cache for existing embedding
 * 2. If not cached, send text to Azure OpenAI's embedding model
 * 3. The model processes the text and returns a vector of 1536 numbers
 * 4. These numbers encode the semantic meaning of the text
 * 5. Cache the result for future use
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Clean and prepare the text
  const cleanedText = text.replace(/\n/g, ' ').trim();

  if (!cleanedText) {
    throw new Error('Cannot generate embedding for empty text');
  }

  // Check cache first
  const cacheKey = getCacheKey(cleanedText);
  const cached = embeddingCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanedText,
  });

  const embedding = response.data[0].embedding;
  
  // Cache for 24 hours (embeddings don't change)
  embeddingCache.set(cacheKey, embedding, 86400);
  
  return embedding;
}

/**
 * Generate embeddings for multiple texts in a batch
 * More efficient than calling generateEmbedding multiple times
 * Now with batch caching support
 *
 * @param texts - Array of texts to convert to embeddings
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const cleanedTexts = texts.map(text => text.replace(/\n/g, ' ').trim());
  
  // Check cache and separate cached vs uncached
  const results: (number[] | null)[] = new Array(cleanedTexts.length).fill(null);
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];
  
  cleanedTexts.forEach((text, index) => {
    const cacheKey = getCacheKey(text);
    const cached = embeddingCache.get(cacheKey);
    if (cached) {
      results[index] = cached;
    } else {
      uncachedIndices.push(index);
      uncachedTexts.push(text);
    }
  });
  
  // Fetch uncached embeddings in batch
  if (uncachedTexts.length > 0) {
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: uncachedTexts,
    });

    response.data.forEach((item, i) => {
      const embedding = item.embedding;
      const originalIndex = uncachedIndices[i];
      results[originalIndex] = embedding;
      
      // Cache each new embedding for 24 hours
      const cacheKey = getCacheKey(uncachedTexts[i]);
      embeddingCache.set(cacheKey, embedding, 86400);
    });
  }

  return results as number[][];
}

/**
 * Calculate cosine similarity between two vectors
 * Returns a value between -1 and 1, where 1 means identical
 * 
 * This is the same calculation done in PostgreSQL with pgvector,
 * but can be useful for client-side filtering
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimensions');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
