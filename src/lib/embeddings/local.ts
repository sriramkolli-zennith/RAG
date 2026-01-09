/**
 * Local Embedding Service using Transformers.js
 * 
 * This service generates embeddings locally without depending on external AI services.
 * Uses Xenova's Transformers.js which runs transformer models in Node.js.
 * 
 * Benefits:
 * - No API costs
 * - No rate limits
 * - Privacy (data stays local)
 * - Works offline
 */

import { pipeline, env } from '@xenova/transformers';
import { embeddingCache } from '../cache';
import crypto from 'crypto';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

// Model configuration
// Using all-MiniLM-L6-v2 - fast, small, good quality embeddings (384 dimensions)
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';

let embeddingPipeline: any = null;

/**
 * Initialize the embedding pipeline (lazy loading)
 */
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('[Embeddings] Loading local embedding model...');
    embeddingPipeline = await pipeline('feature-extraction', MODEL_NAME);
    console.log('[Embeddings] Model loaded successfully');
  }
  return embeddingPipeline;
}

/**
 * Generate a cache key for text
 */
function getCacheKey(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Generate an embedding vector for a single piece of text
 * 
 * @param text - The text to convert to an embedding
 * @returns A 384-dimensional vector (using all-MiniLM-L6-v2)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
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

  // Generate embedding locally
  const extractor = await getEmbeddingPipeline();
  const output = await extractor(cleanedText, { pooling: 'mean', normalize: true });
  
  // Convert tensor to array
  const embedding = Array.from(output.data) as number[];
  
  // Cache for 24 hours
  embeddingCache.set(cacheKey, embedding, 86400);
  
  return embedding;
}

/**
 * Generate embeddings for multiple texts in a batch
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

  // Generate embeddings for uncached texts
  if (uncachedTexts.length > 0) {
    const extractor = await getEmbeddingPipeline();
    
    // Process in batches to avoid memory issues
    const batchSize = 10;
    for (let i = 0; i < uncachedTexts.length; i += batchSize) {
      const batch = uncachedTexts.slice(i, i + batchSize);
      const batchIndices = uncachedIndices.slice(i, i + batchSize);
      
      // Generate embeddings for batch
      for (let j = 0; j < batch.length; j++) {
        const output = await extractor(batch[j], { pooling: 'mean', normalize: true });
        const embedding = Array.from(output.data) as number[];
        
        const originalIndex = batchIndices[j];
        results[originalIndex] = embedding;
        
        // Cache the result
        const cacheKey = getCacheKey(batch[j]);
        embeddingCache.set(cacheKey, embedding, 86400);
      }
    }
  }

  return results as number[][];
}

/**
 * Get embedding dimension for the current model
 */
export function getEmbeddingDimension(): number {
  return 384; // all-MiniLM-L6-v2 produces 384-dimensional embeddings
}
