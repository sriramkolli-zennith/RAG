import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/rag';
import { createClient } from '@supabase/supabase-js';
import { logApiCall, logError, logRagOperation } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/chat/regenerate
 * 
 * Regenerate the assistant's response for the last message
 * 
 * Request body:
 * - messageId: string - ID of the assistant message to regenerate
 * - conversationId: string - Conversation ID
 * - sessionId: string - Session ID
 * - options: object - Optional configuration
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { messageId, conversationId, sessionId, options = {} } = body;

    if (!messageId || !conversationId) {
      return NextResponse.json(
        { error: 'messageId and conversationId are required' },
        { status: 400 }
      );
    }

    logRagOperation('regenerate_response_start', {
      messageId,
      conversationId,
    });

    // Get the message being regenerated
    const { data: assistantMessage, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !assistantMessage) {
      throw new Error('Message not found');
    }

    // Find the user message that prompted this response
    const { data: userMessage, error: userError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .lt('created_at', assistantMessage.created_at)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (userError || !userMessage) {
      throw new Error('User message not found');
    }

    // Load conversation history up to the user message
    const { data: history, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .lt('created_at', userMessage.created_at)
      .order('created_at', { ascending: true });

    // Generate new response (chat function loads history automatically)
    const response = await chat(userMessage.content, sessionId, {
      matchThreshold: options.matchThreshold ?? 0.85,
      matchCount: options.matchCount ?? 5,
      includeHistory: options.includeHistory ?? true,
    });

    // Update the message with new content
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({
        content: response.answer,
        sources: response.sources.map(s => ({
          id: s.id,
          content: s.content.substring(0, 200),
          metadata: s.metadata,
          similarity: s.similarity,
        })),
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create a new message to mark this as a regenerated response
    const { data: regenerationRecord } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'system',
        content: `Response regenerated at ${new Date().toISOString()}`,
        regenerated_from: messageId,
      })
      .select()
      .single();

    const duration = Date.now() - startTime;
    logApiCall('POST', '/api/chat/regenerate', duration);
    logRagOperation('regenerate_response_complete', {
      messageId,
      duration_ms: duration,
      sourcesCount: response.sources.length,
    });

    return NextResponse.json({
      success: true,
      data: {
        messageId: updatedMessage.id,
        answer: updatedMessage.content,
        sources: response.sources.map(source => ({
          id: source.id,
          content: source.content.substring(0, 200) + '...',
          metadata: source.metadata,
          similarity: source.similarity,
        })),
      },
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'regenerate_response_api');

    return NextResponse.json(
      {
        error: 'Failed to regenerate response',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}
