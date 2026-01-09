import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger, logApiCall, logError, logRagOperation } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/conversations/[conversationId]/messages
 * 
 * Get all messages in a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const startTime = Date.now();

  try {
    const { conversationId } = await params;

    logRagOperation('get_messages_start', {
      conversationId,
    });

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    const duration = Date.now() - startTime;
    logApiCall('GET', `/api/conversations/${conversationId}/messages`, duration);

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'get_messages');

    return NextResponse.json(
      {
        error: 'Failed to retrieve messages',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations/[conversationId]/messages
 * 
 * Add a message to a conversation
 * 
 * Request body:
 * - role: 'user' | 'assistant'
 * - content: string
 * - sources: array - Optional sources
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const startTime = Date.now();

  try {
    const { conversationId } = await params;
    const body = await request.json();
    const { role, content, sources = [] } = body;

    if (!role || !content) {
      return NextResponse.json(
        { error: 'Role and content are required' },
        { status: 400 }
      );
    }

    logRagOperation('add_message_start', {
      conversationId,
      role,
      contentLength: content.length,
    });

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        sources,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    const duration = Date.now() - startTime;
    logApiCall('POST', `/api/conversations/${conversationId}/messages`, duration);
    logRagOperation('add_message_complete', {
      messageId: data.id,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'add_message');

    return NextResponse.json(
      {
        error: 'Failed to add message',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations/[conversationId]/messages/[messageId]
 * 
 * Delete a message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  const startTime = Date.now();

  try {
    const { messageId, conversationId } = await params;

    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      throw error;
    }

    const duration = Date.now() - startTime;
    logApiCall('DELETE', `/api/conversations/${conversationId}/messages/${messageId}`, duration);

    return NextResponse.json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'delete_message');

    return NextResponse.json(
      {
        error: 'Failed to delete message',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}
