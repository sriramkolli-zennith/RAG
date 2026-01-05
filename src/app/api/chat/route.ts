import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/rag';

/**
 * POST /api/chat
 * 
 * Main chat endpoint - sends a message and gets a RAG-powered response
 * 
 * Request body:
 * - message: string - The user's question
 * - sessionId: string - Unique session identifier
 * - options: object - Optional configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, options = {} } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get RAG-powered response
    const response = await chat(message, sessionId, {
      matchThreshold: options.matchThreshold ?? 0.7,
      matchCount: options.matchCount ?? 5,
      includeHistory: options.includeHistory ?? true,
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
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
