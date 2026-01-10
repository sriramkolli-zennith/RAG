import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/debug/check-embeddings
 * 
 * Check the actual format of embeddings in database
 */
export async function GET() {
  try {
    const supabase = createServerClient();

    // Get raw embedding data using a direct SQL query
    const { data, error } = await supabase
      .from('documents')
      .select('id, content, embedding')
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Try to understand the embedding format
    let embeddingInfo = {
      raw: data.embedding,
      type: typeof data.embedding,
      isArray: Array.isArray(data.embedding),
      length: Array.isArray(data.embedding) ? data.embedding.length : 'N/A',
      sample: Array.isArray(data.embedding) ? data.embedding.slice(0, 5) : 'N/A',
    };

    // Try parsing as string if it's a string
    if (typeof data.embedding === 'string') {
      try {
        const parsed = JSON.parse(data.embedding);
        embeddingInfo = {
          ...embeddingInfo,
          parsedIsArray: Array.isArray(parsed),
          parsedLength: Array.isArray(parsed) ? parsed.length : 'N/A',
          parsedSample: Array.isArray(parsed) ? parsed.slice(0, 5) : 'N/A',
        } as any;
      } catch (e: any) {
        embeddingInfo = { ...embeddingInfo, parseError: e.message } as any;
      }
    }

    return NextResponse.json({
      success: true,
      documentId: data.id,
      contentPreview: data.content.substring(0, 100),
      embeddingInfo,
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({
      error: 'Failed to check embeddings',
      message: errorObj.message,
    }, { status: 500 });
  }
}
