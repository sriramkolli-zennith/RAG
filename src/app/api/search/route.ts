import { NextRequest, NextResponse } from 'next/server';
import { searchDocuments } from '@/lib/rag';

/**
 * POST /api/search
 * 
 * Semantic search endpoint - search the knowledge base
 * 
 * Request body:
 * - query: string - The search query
 * - matchThreshold: number - Minimum similarity (0-1)
 * - matchCount: number - Maximum results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, matchThreshold = 0.7, matchCount = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const results = await searchDocuments(query, matchThreshold, matchCount);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
