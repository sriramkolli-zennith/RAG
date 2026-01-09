import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { generateEmbedding } from '@/lib/embeddings/local';

/**
 * GET /api/debug/test-search
 * 
 * Test vector search with a real query
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    const testQuery = "skills of Leela Madhava Rao";

    // Generate embedding for test query
    console.log('[TestSearch] Generating embedding for:', testQuery);
    const queryEmbedding = await generateEmbedding(testQuery);
    console.log('[TestSearch] Embedding length:', queryEmbedding.length);
    console.log('[TestSearch] Embedding sample (first 5):', queryEmbedding.slice(0, 5));

    // Get a document's embedding for comparison
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('id, content, embedding')
      .limit(1)
      .single();

    if (docError) {
      return NextResponse.json({ error: 'Failed to get document', details: docError });
    }

    // Parse document embedding
    let docEmbedding: number[] = [];
    if (docData.embedding) {
      if (typeof docData.embedding === 'string') {
        // Remove brackets and parse
        const cleaned = docData.embedding.replace(/[\[\]]/g, '');
        docEmbedding = cleaned.split(',').map(Number);
      } else if (Array.isArray(docData.embedding)) {
        docEmbedding = docData.embedding;
      }
    }

    console.log('[TestSearch] Doc embedding length:', docEmbedding.length);
    console.log('[TestSearch] Doc embedding sample (first 5):', docEmbedding.slice(0, 5));

    // Calculate cosine similarity manually
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < queryEmbedding.length; i++) {
      dotProduct += queryEmbedding[i] * docEmbedding[i];
      normA += queryEmbedding[i] * queryEmbedding[i];
      normB += docEmbedding[i] * docEmbedding[i];
    }
    
    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    console.log('[TestSearch] Manual cosine similarity:', similarity);

    // Format embedding as PostgreSQL vector string
    const embeddingString = `[${queryEmbedding.join(',')}]`;
    console.log('[TestSearch] Embedding string (first 50 chars):', embeddingString.substring(0, 50));

    // Test 1: Direct RPC call with string format
    const { data: rpcData, error: rpcError } = await supabase.rpc('match_documents', {
      query_embedding: embeddingString,
      match_threshold: 0.0,
      match_count: 5,
    });

    console.log('[TestSearch] RPC error:', rpcError);
    console.log('[TestSearch] RPC data:', rpcData);

    // Test 2: Raw SQL query to check the embedding format
    const { data: rawData, error: rawError } = await supabase
      .from('documents')
      .select('id, content, metadata')
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        testQuery,
        queryEmbeddingLength: queryEmbedding.length,
        queryEmbeddingSample: queryEmbedding.slice(0, 5),
        docContent: docData.content.substring(0, 100) + '...',
        docEmbeddingLength: docEmbedding.length,
        docEmbeddingSample: docEmbedding.slice(0, 5),
        manualCosineSimilarity: similarity,
        rpcResults: rpcData,
        rpcError: rpcError?.message,
        rawDocuments: rawData?.length,
      },
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
