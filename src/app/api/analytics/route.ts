import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logApiCall, logRagOperation } from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/analytics
 * 
 * Track usage analytics
 * 
 * Request body:
 * - event: string - Event name
 * - properties: object - Event properties
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { event, properties = {} } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    logRagOperation('analytics_event', {
      event,
      properties,
    });

    // Store analytics in database (simple implementation)
    const { error } = await supabase.from('analytics_events').insert({
      event_name: event,
      properties,
      timestamp: new Date().toISOString(),
    });

    if (error && error.code !== '42P01') { // Ignore if table doesn't exist
      console.error('Analytics error:', error);
    }

    const duration = Date.now() - startTime;
    logApiCall('POST', '/api/analytics', duration);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ success: true }); // Always return success to not block UI
  }
}

/**
 * GET /api/analytics
 * 
 * Get analytics summary
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get conversation stats
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString());

    // Get message stats
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, role, created_at')
      .gte('created_at', startDate.toISOString());

    const stats = {
      period: `Last ${days} days`,
      conversations: {
        total: conversations?.length || 0,
        perDay: ((conversations?.length || 0) / days).toFixed(1),
      },
      messages: {
        total: messages?.length || 0,
        user: messages?.filter(m => m.role === 'user').length || 0,
        assistant: messages?.filter(m => m.role === 'assistant').length || 0,
        perConversation: conversations?.length 
          ? ((messages?.length || 0) / conversations.length).toFixed(1)
          : 0,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
