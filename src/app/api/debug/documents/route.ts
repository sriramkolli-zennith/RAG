import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/debug/documents
 * Debug endpoint to check document content
 */
export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('documents')
      .select('id, content, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      documents: data?.map(doc => ({
        id: doc.id,
        contentPreview: doc.content.substring(0, 200),
        contentLength: doc.content.length,
        metadata: doc.metadata,
        created_at: doc.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
