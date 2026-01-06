import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Google Gemini client singleton
 * Used for generating embeddings and chat completions
 */
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Initialize models
export const embeddingModel = genAI.getGenerativeModel({
  model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004'
});
export const chatModel = genAI.getGenerativeModel({
  model: process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-pro-latest'
});

/**
 * Configuration for embedding generation
 * text-embedding-004 produces 768-dimensional vectors
 */
export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Configuration for chat completion
 */
export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-1.5-pro-latest';
export const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '1000');
export const TEMPERATURE = parseFloat(process.env.TEMPERATURE || '0.7');
