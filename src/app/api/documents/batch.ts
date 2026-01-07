import { NextRequest, NextResponse } from 'next/server';
import { addDocuments } from '@/lib/rag/vector-store';
import { logger, logApiCall, logError, logRagOperation } from '@/lib/logger';
import { validateData, batchUploadSchema } from '@/lib/validation';

/**
 * POST /api/documents/batch
 * 
 * Batch upload multiple documents
 * 
 * Request body:
 * - documents: Array of { content: string, source?: string }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    
    // Validate batch
    const validation = validateData(batchUploadSchema, body);
    if (!validation.valid) {
      logger.error({ errors: validation.errors }, 'Batch validation failed');
      return NextResponse.json(
        { error: 'Invalid batch upload', details: validation.errors },
        { status: 400 }
      );
    }

    const { documents } = validation.data as { documents: Array<{ content: string; source?: string }> };
    logRagOperation('batch_upload_start', {
      count: documents.length,
    });

    // Convert to internal format
    const docsToAdd = documents.map((doc: { content: string; source?: string }) => ({
      content: doc.content,
      metadata: { source: doc.source || 'Batch Upload' },
    }));

    // Add documents
    const results = await addDocuments(docsToAdd);

    const duration = Date.now() - startTime;
    logApiCall('POST', '/api/documents/batch', duration);
    logRagOperation('batch_upload_complete', {
      count: results.length,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully uploaded ${results.length} documents`,
        count: results.length,
        documentIds: results.map(d => d.id),
      },
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'batch_upload_api');
    
    return NextResponse.json(
      { 
        error: 'Batch upload failed',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}
