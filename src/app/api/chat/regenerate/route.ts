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

    // First, verify the message exists and is an assistant message
    const { data: targetMessage, error: targetError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('conversation_id', conversationId)
      .single();

    if (targetError || !targetMessage) {
      logError(
        new Error(`Target message not found: ${messageId} in conversation ${conversationId}`),
        'message_not_found_regenerate'
      );
      throw new Error(`Message not found: ${messageId}`);
    }

    if (targetMessage.role !== 'assistant') {
      throw new Error('Can only regenerate assistant messages');
    }

    // Get all messages for this conversation ordered by creation time
    const { data: allMessages, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      logError(fetchError, 'fetch_messages_regenerate');
      throw new Error(`Failed to fetch messages: ${fetchError.message}`);
    }

    if (!allMessages || allMessages.length === 0) {
      throw new Error('No messages found in conversation');
    }

    // Find the assistant message being regenerated
    const messageIndex = allMessages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) {
      // Log available message IDs for debugging
      const availableIds = allMessages.map(m => m.id).join(', ');
      logError(
        new Error(`Message ${messageId} not found. Available: ${availableIds}`),
        'message_not_found_regenerate'
      );
      throw new Error(`Message not found. Searched for: ${messageId}`);
    }

    const assistantMessage = allMessages[messageIndex];
    
    // The assistant message should be preceded by a user message
    // Find the most recent user message before this assistant message
    let userMessage = null;
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (allMessages[i].role === 'user') {
        userMessage = allMessages[i];
        break;
      }
    }

    if (!userMessage) {
      throw new Error('No user message found before this response');
    }

    // Load conversation history up to the user message
    const historyMessages = allMessages.slice(0, messageIndex - 1);

    // Generate new response
    const response = await chat(userMessage.content, sessionId, {
      matchThreshold: options.matchThreshold ?? 0.5,
      matchCount: options.matchCount ?? 5,
      includeHistory: false, // We manage history manually here
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
