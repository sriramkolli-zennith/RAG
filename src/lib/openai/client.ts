import OpenAI from 'openai';

/**
 * OpenAI client singleton
 * Used for generating embeddings and chat completions
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;

/**
 * Configuration for embedding generation
 * text-embedding-ada-002 produces 1536-dimensional vectors
 */
export const EMBEDDING_MODEL = 'text-embedding-ada-002';
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Configuration for chat completion
 */
export const CHAT_MODEL = 'gpt-4o-mini';
export const MAX_TOKENS = 1000;
export const TEMPERATURE = 0.7;
