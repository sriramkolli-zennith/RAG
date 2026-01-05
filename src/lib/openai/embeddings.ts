import openai, { EMBEDDING_MODEL } from './client';

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
 * Generate an embedding vector for a single piece of text
 * 
 * @param text - The text to convert to an embedding
 * @returns A 1536-dimensional vector representing the text's semantic meaning
 * 
 * How it works:
 * 1. The text is sent to OpenAI's embedding model
 * 2. The model processes the text and returns a vector of 1536 numbers
 * 3. These numbers encode the semantic meaning of the text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Clean and prepare the text
  const cleanedText = text.replace(/\n/g, ' ').trim();
  
  if (!cleanedText) {
    throw new Error('Cannot generate embedding for empty text');
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanedText,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in a batch
 * More efficient than calling generateEmbedding multiple times
 * 
 * @param texts - Array of texts to convert to embeddings
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const cleanedTexts = texts.map(text => text.replace(/\n/g, ' ').trim());
  
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanedTexts,
  });

  // Sort by index to maintain order
  return response.data
    .sort((a, b) => a.index - b.index)
    .map(item => item.embedding);
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
