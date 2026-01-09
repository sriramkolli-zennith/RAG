import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/client';

/**
 * DELETE /api/documents/delete-all
 * Delete all documents from the knowledge base
 */
export async function DELETE() {
  try {
    const supabase = createServerClient();
    
    const { error } = await supabase
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All documents deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete documents' },
      { status: 500 }
    );
  }
}
