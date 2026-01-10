import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger, logApiCall, logError } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
