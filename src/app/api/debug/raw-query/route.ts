import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';
import { generateEmbedding } from '@/lib/openai/embeddings';

/**
 * GET /api/debug/raw-query
 * 
 * Test if we can manually calculate similarity
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Get all documents
    const { data: docs, error } = await supabase
      .from('documents')
      .select('id, content, embedding')
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate embedding for test query
    const testQuery = "skills of Leela Madhava Rao";
    const queryEmbedding = await generateEmbedding(testQuery);

    // Calculate similarity for each document manually
    const results = docs?.map(doc => {
      // Parse embedding if it's a string
      let docEmbedding: number[] = [];
      if (typeof doc.embedding === 'string') {
        docEmbedding = JSON.parse(doc.embedding);
      } else if (Array.isArray(doc.embedding)) {
        docEmbedding = doc.embedding;
      }

      // Calculate cosine similarity
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      
      for (let i = 0; i < queryEmbedding.length; i++) {
        dotProduct += queryEmbedding[i] * docEmbedding[i];
        normA += queryEmbedding[i] * queryEmbedding[i];
        normB += docEmbedding[i] * docEmbedding[i];
      }
      
      const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

      return {
        id: doc.id,
        content: doc.content.substring(0, 100),
        similarity: similarity.toFixed(4),
        embeddingFormat: typeof doc.embedding,
      };
    }).sort((a, b) => parseFloat(b.similarity) - parseFloat(a.similarity));

    return NextResponse.json({
      success: true,
      testQuery,
      results,
      message: 'These are the results if we calculate similarity in JavaScript. Compare with RPC results.',
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({
      error: 'Query failed',
      message: errorObj.message,
      stack: errorObj.stack,
    }, { status: 500 });
  }
}
