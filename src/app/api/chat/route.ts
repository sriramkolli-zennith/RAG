import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/rag';
import { createClient } from '@supabase/supabase-js';
import { logger, logApiCall, logError, logRagOperation } from '@/lib/logger';
import { validateData, chatMessageSchema } from '@/lib/validation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/chat
 * 
 * Main chat endpoint - sends a message and gets a RAG-powered response
 * Supports conversation history and context awareness
 * 
 * Request body:
 * - message: string - The user's question
 * - sessionId: string - Unique session identifier
 * - conversationId: string - Optional conversation ID for history
 * - options: object - Optional configuration
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { message, sessionId, conversationId, options = {} } = body;

    // Validate input
    const validation = validateData(chatMessageSchema, { message, sessionId });
    if (!validation.valid) {
      logger.warn({ errors: validation.errors }, 'Chat validation failed');
      return NextResponse.json(
        { error: 'Invalid input', details: validation.errors },
        { status: 400 }
      );
    }

    logRagOperation('chat_start', {
      sessionId,
      conversationId,
      messageLength: message.length,
      options,
    });

    // Build message history if conversation exists (in parallel with RAG)
    let messageHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    const historyPromise = conversationId ? supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10) // Last 10 messages for context
      : Promise.resolve({ data: null, error: null });

    // Get RAG-powered response (start in parallel with history fetch)
    const [historyResult, response] = await Promise.all([
      historyPromise,
      chat(message, sessionId, {
        matchThreshold: options.matchThreshold ?? 0.85,
        matchCount: options.matchCount ?? 5,
        includeHistory: options.includeHistory ?? true,
      })
    ]);

    if (!historyResult.error && historyResult.data) {
      messageHistory = historyResult.data as Array<{ role: 'user' | 'assistant'; content: string }>;
      logRagOperation('loaded_message_history', {
        conversationId,
        historyCount: historyResult.data.length,
      });
    }

    // Save messages in batch if conversationId provided (fire and forget for better latency)
    if (conversationId) {
      const now = new Date().toISOString();
      // Batch insert both messages and update conversation in parallel
      Promise.all([
        supabase.from('messages').insert([
          {
            conversation_id: conversationId,
            role: 'user',
            content: message,
            sources: [],
          },
          {
            conversation_id: conversationId,
            role: 'assistant',
            content: response.answer,
            sources: response.sources.map(s => ({
              id: s.id,
              content: s.content.substring(0, 200),
              metadata: s.metadata,
              similarity: s.similarity,
            })),
          }
        ]),
        supabase
          .from('conversations')
          .update({ updated_at: now })
          .eq('id', conversationId)
      ]).catch(err => logger.error(err, 'Failed to save messages'));
    }

    const duration = Date.now() - startTime;
    logApiCall('POST', '/api/chat', duration);
    logRagOperation('chat_complete', {
      sessionId,
      conversationId,
      sourcesCount: response.sources.length,
      historyCount: messageHistory.length,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        answer: response.answer,
        sources: response.sources.map(source => ({
          id: source.id,
          content: source.content.substring(0, 200) + '...',
          metadata: source.metadata,
          similarity: source.similarity,
        })),
        sessionId: response.sessionId,
        conversationId,
      },
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'chat_api');
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat request',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}
