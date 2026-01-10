import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/debug/db-status
 * 
 * Check database configuration and document status
 */
export async function GET() {
  try {
    const supabase = createServerClient();

    // Check if documents table exists and get column info including embeddings
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, content, metadata, embedding')
      .limit(5);

    if (docsError) {
      return NextResponse.json({
        error: docsError.message,
        hint: 'Database might not be initialized. Run the schema.sql in Supabase.',
      }, { status: 500 });
    }

    // Check embedding dimensions for each document
    const documentDetails = documents?.map(d => {
      let embeddingInfo = 'No embedding';
      if (d.embedding) {
        try {
          // Embedding could be array or string
          const embArray = Array.isArray(d.embedding) ? d.embedding : 
            (typeof d.embedding === 'string' ? JSON.parse(d.embedding) : null);
          embeddingInfo = embArray ? `${embArray.length} dimensions` : 'Invalid format';
        } catch (e) {
          embeddingInfo = `Parse error: ${d.embedding?.toString().substring(0, 50)}...`;
        }
      }
      return {
        id: d.id,
        contentPreview: d.content.substring(0, 100) + '...',
        metadata: d.metadata,
        embedding: embeddingInfo,
      };
    });

    // Try to check embedding dimension by attempting a query
    let embeddingDimension = 'unknown';
    let dimensionError = null;
    let testSearchResult = null;

    try {
      // This will fail if dimensions don't match
      const { data: testData, error: dimError } = await supabase.rpc('match_documents', {
        query_embedding: Array(1536).fill(0.01),
        match_threshold: 0.0, // Very low threshold to find anything
        match_count: 1,
      });

      if (dimError) {
        dimensionError = dimError.message;
        // Check if it's a dimension mismatch
        if (dimError.message.includes('1536')) {
          embeddingDimension = '1536 (Azure OpenAI - needs migration!)';
        }
      } else {
        embeddingDimension = '384 (Local embeddings - correct!)';
        testSearchResult = testData?.length > 0 ? 'Search working!' : 'No results (documents may have NULL embeddings)';
      }
    } catch (e: any) {
      dimensionError = e.message;
    }

    // Check if documents have NULL embeddings
    const { data: nullEmbeddingDocs, error: nullError } = await supabase
      .from('documents')
      .select('id')
      .is('embedding', null);

    const nullEmbeddingCount = nullEmbeddingDocs?.length || 0;

    return NextResponse.json({
      success: true,
      data: {
        documentCount: documents?.length || 0,
        nullEmbeddingCount,
        documents: documentDetails,
        embeddingDimension,
        dimensionError,
        testSearchResult,
        status: nullEmbeddingCount > 0 
          ? `⚠️ ${nullEmbeddingCount} documents have NULL embeddings - delete and re-upload!`
          : embeddingDimension.includes('384') 
            ? '✅ Ready for local embeddings'
            : '⚠️ Migration needed - run 003_switch_to_local_embeddings.sql',
      },
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json(
      {
        error: 'Failed to check database status',
        message: errorObj.message,
      },
      { status: 500 }
    );
  }
}
