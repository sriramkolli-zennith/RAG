import { AzureOpenAI } from 'openai';

/**
 * Azure OpenAI client singleton
 * Used for generating embeddings and chat completions
 */
const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
});

export default openai;

/**
 * Configuration for embedding generation
 * text-embedding-ada-002 produces 1536-dimensional vectors
 */
export const EMBEDDING_MODEL = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';
export const EMBEDDING_DIMENSIONS = 1536;

/**
 * Configuration for chat completion
 */
export const CHAT_MODEL = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT || 'gpt-4o-mini';
export const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '1000');
export const TEMPERATURE = parseFloat(process.env.TEMPERATURE || '0.7');
