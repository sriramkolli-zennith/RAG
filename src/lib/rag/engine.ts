import openai, { CHAT_MODEL, MAX_TOKENS, TEMPERATURE } from '../openai/client';
import { searchDocuments, SearchResult } from './vector-store';
import { createServerClient } from '../supabase/client';
import { ChatMessageInsert } from '../supabase/database.types';

/**
 * RAG Engine
 * 
 * This is the heart of the RAG (Retrieval-Augmented Generation) system.
 * It combines semantic search with LLM generation to answer questions
 * based on your knowledge base.
 * 
 * RAG Flow:
 * 1. RETRIEVE: Find relevant documents from the vector store
 * 2. AUGMENT: Add the retrieved context to the prompt
 * 3. GENERATE: Use an LLM to generate an answer based on the context
 */

export interface ChatResponse {
  answer: string;
  sources: SearchResult[];
  sessionId: string;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * The system prompt instructs the LLM how to behave
 * This is crucial for consistent, high-quality responses
 */
const SYSTEM_PROMPT = `You are a helpful AI assistant that answers questions based on the provided context.

IMPORTANT RULES:
1. Only answer based on the provided context
2. If the context doesn't contain enough information to answer, say so honestly
3. Be concise but thorough
4. If you reference information from the context, be specific
5. Don't make up information that isn't in the context
6. Use a friendly, professional tone

Remember: You are a knowledge base assistant. Your answers should be accurate and helpful.`;

/**
 * Format retrieved documents into context for the LLM
 */
function formatContext(documents: SearchResult[]): string {
  if (documents.length === 0) {
    return 'No relevant context found in the knowledge base.';
  }

  return documents
    .map((doc, index) => {
      const source = doc.metadata.source || 'Unknown';
      return `[Document ${index + 1}] (Source: ${source}, Relevance: ${(doc.similarity * 100).toFixed(1)}%)
${doc.content}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Get chat history for a session
 */
async function getChatHistory(sessionId: string, limit: number = 10): Promise<ConversationMessage[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from('chat_history')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) {
    console.error('Failed to get chat history:', error);
    return [];
  }

  return data.map((msg: any) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));
}

/**
 * Save a message to chat history
 */
async function saveChatMessage(sessionId: string, role: 'user' | 'assistant', content: string): Promise<void> {
  const supabase = createServerClient();
  
  const result: any = await supabase
    .from('chat_history')
    .insert({
      session_id: sessionId,
      role,
      content,
    });

  const { error } = result;

  if (error) {
    console.error('Failed to save chat message:', error);
  }
}

/**
 * Main RAG function - answers a question using the knowledge base
 * 
 * @param query - The user's question
 * @param sessionId - Unique identifier for the conversation
 * @param options - Configuration options
 */
export async function chat(
  query: string,
  sessionId: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
    includeHistory?: boolean;
  } = {}
): Promise<ChatResponse> {
  const {
    matchThreshold = 0.7,
    matchCount = 5,
    includeHistory = true,
  } = options;

  // Step 1: RETRIEVE - Find relevant documents
  const relevantDocs = await searchDocuments(query, matchThreshold, matchCount);
  const context = formatContext(relevantDocs);

  // Step 2: Build the conversation with context
  const messages: ConversationMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // Include previous conversation history for context
  if (includeHistory) {
    const history = await getChatHistory(sessionId);
    messages.push(...history);
  }

  // Add the context and user query
  messages.push({
    role: 'user',
    content: `Context from knowledge base:
---
${context}
---

Based on the above context, please answer the following question:
${query}`,
  });

  // Step 3: GENERATE - Get answer from LLM
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
  });

  const answer = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

  // Save the conversation to history
  await saveChatMessage(sessionId, 'user', query);
  await saveChatMessage(sessionId, 'assistant', answer);

  return {
    answer,
    sources: relevantDocs,
    sessionId,
  };
}

/**
 * Stream a chat response for real-time display
 * Returns an async generator that yields tokens as they arrive
 */
export async function* streamChat(
  query: string,
  sessionId: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
    includeHistory?: boolean;
  } = {}
): AsyncGenerator<{ type: 'token' | 'sources'; data: string | SearchResult[] }> {
  const {
    matchThreshold = 0.7,
    matchCount = 5,
    includeHistory = true,
  } = options;

  // Step 1: RETRIEVE
  const relevantDocs = await searchDocuments(query, matchThreshold, matchCount);
  const context = formatContext(relevantDocs);

  // Yield sources immediately so UI can display them
  yield { type: 'sources', data: relevantDocs };

  // Step 2: Build messages
  const messages: ConversationMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  if (includeHistory) {
    const history = await getChatHistory(sessionId);
    messages.push(...history);
  }

  messages.push({
    role: 'user',
    content: `Context from knowledge base:
---
${context}
---

Based on the above context, please answer the following question:
${query}`,
  });

  // Step 3: GENERATE with streaming
  const stream = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    stream: true,
  });

  let fullResponse = '';

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || '';
    if (token) {
      fullResponse += token;
      yield { type: 'token', data: token };
    }
  }

  // Save to history
  await saveChatMessage(sessionId, 'user', query);
  await saveChatMessage(sessionId, 'assistant', fullResponse);
}
