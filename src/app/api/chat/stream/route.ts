import { NextRequest } from 'next/server';
import { streamChat } from '@/lib/rag';

/**
 * POST /api/chat/stream
 * 
 * Streaming chat endpoint - returns tokens as they are generated
 * Uses Server-Sent Events (SSE) for real-time streaming
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, options = {} } = body;

    if (!message || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Message and sessionId are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a TransformStream for streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start streaming in the background
    (async () => {
      try {
        const chatStream = streamChat(message, sessionId, {
          matchThreshold: options.matchThreshold ?? 0.7,
          matchCount: options.matchCount ?? 5,
          includeHistory: options.includeHistory ?? true,
        });

        for await (const chunk of chatStream) {
          const data = JSON.stringify(chunk) + '\n';
          await writer.write(encoder.encode(`data: ${data}\n`));
        }

        await writer.write(encoder.encode('data: [DONE]\n\n'));
      } catch (error) {
        console.error('Streaming error:', error);
        const errorData = JSON.stringify({ type: 'error', data: 'Stream failed' });
        await writer.write(encoder.encode(`data: ${errorData}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Stream API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to initialize stream' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
