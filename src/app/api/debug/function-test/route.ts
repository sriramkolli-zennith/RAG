import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/debug/function-test
 * 
 * Test if the match_documents function exists and what it expects
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Try calling with a simple test embedding
    const testEmbedding = Array(384).fill(0.1);
    const embeddingString = `[${testEmbedding.join(',')}]`;
    
    console.log('Testing RPC with:', {
      embeddingFormat: typeof embeddingString,
      embeddingLength: embeddingString.length,
      embeddingSample: embeddingString.substring(0, 50) + '...',
    });
    
    // Try the RPC call
    const { data, error } = await supabase
      .rpc('match_documents', {
        query_embedding: embeddingString,
        match_threshold: 0.0,
        match_count: 5,
      });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        errorDetails: error,
        hint: 'The function might not exist or has wrong signature',
      });
    }

    return NextResponse.json({
      success: true,
      resultsCount: data?.length || 0,
      results: data,
      message: 'If this returns 0 results with threshold 0.0, the function is broken',
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({
      error: 'Test failed',
      message: errorObj.message,
      stack: errorObj.stack,
    }, { status: 500 });
  }
}
