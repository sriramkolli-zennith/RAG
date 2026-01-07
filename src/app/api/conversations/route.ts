import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger, logApiCall, logError, logRagOperation } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/conversations
 * 
 * Get all conversations for a session or user
 * 
 * Query params:
 * - sessionId: string - Filter by session
 * - userId: string - Filter by user
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    logRagOperation('get_conversations_start', {
      sessionId,
      userId,
    });

    let query = supabase.from('conversations').select('*');

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    const duration = Date.now() - startTime;
    logApiCall('GET', '/api/conversations', duration);

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'get_conversations');

    return NextResponse.json(
      {
        error: 'Failed to retrieve conversations',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * 
 * Create a new conversation
 * 
 * Request body:
 * - sessionId: string - Unique session identifier
 * - title: string - Conversation title
 * - userId: string - Optional user identifier
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { sessionId, title, userId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    logRagOperation('create_conversation_start', {
      sessionId,
      hasTitle: !!title,
    });

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        session_id: sessionId,
        title: title || `Conversation ${new Date().toLocaleDateString()}`,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const duration = Date.now() - startTime;
    logApiCall('POST', '/api/conversations', duration);
    logRagOperation('create_conversation_complete', {
      conversationId: data.id,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'create_conversation');

    return NextResponse.json(
      {
        error: 'Failed to create conversation',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/conversations
 * 
 * Update a conversation
 * 
 * Query params:
 * - id: string - Conversation ID
 * 
 * Request body:
 * - title: string - New title
 * - archived: boolean - Archive status
 */
export async function PATCH(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    logRagOperation('update_conversation_start', {
      conversationId: id,
      updates: Object.keys(body),
    });

    const { data, error } = await supabase
      .from('conversations')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const duration = Date.now() - startTime;
    logApiCall('PATCH', '/api/conversations', duration);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'update_conversation');

    return NextResponse.json(
      {
        error: 'Failed to update conversation',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/conversations
 * 
 * Delete a conversation
 * 
 * Query params:
 * - id: string - Conversation ID
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    const duration = Date.now() - startTime;
    logApiCall('DELETE', '/api/conversations', duration);

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'delete_conversation');

    return NextResponse.json(
      {
        error: 'Failed to delete conversation',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}
