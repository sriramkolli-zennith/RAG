import { NextRequest, NextResponse } from 'next/server';
import { addDocument, addDocuments, getAllDocuments, deleteDocument } from '@/lib/rag';
import { processDocument } from '@/lib/rag/chunking';
import { logger, logApiCall, logError, logRagOperation } from '@/lib/logger';
import { validateData, batchUploadSchema } from '@/lib/validation';

/**
 * GET /api/documents
 * 
 * Retrieve all documents from the knowledge base
 */
export async function GET() {
  try {
    const documents = await getAllDocuments();
    
    return NextResponse.json({
      success: true,
      data: documents,
      count: documents.length,
    });
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/documents
 * 
 * Add a new document or batch of documents to the knowledge base
 * 
 * Request body:
 * Option 1 - Single document:
 * - content: string - The document content
 * - metadata: object - Optional metadata
 * - chunk: boolean - Whether to chunk the document (default: true)
 * - chunkOptions: object - Chunking options
 * 
 * Option 2 - Batch upload:
 * - documents: Array of { content: string, source?: string }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Check if this is a batch upload
    if (body.documents && Array.isArray(body.documents)) {
      // Validate batch
      const validation = validateData(batchUploadSchema, body);
      if (!validation.valid) {
        logger.warn({ errors: validation.errors }, 'Batch validation failed');
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
      const docsToAdd = documents.map(doc => ({
        content: doc.content,
        metadata: { source: doc.source || 'Batch Upload' },
      }));

      // Add documents
      const results = await addDocuments(docsToAdd);

      const duration = Date.now() - startTime;
      logApiCall('POST', '/api/documents', duration);
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
    }

    // Single document upload
    const { content, metadata = {}, chunk = true, chunkOptions = {} } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    logRagOperation('single_document_upload_start', {
      hasMetadata: Object.keys(metadata).length > 0,
    });

    let result;

    if (chunk) {
      // Process document into chunks
      const chunks = processDocument(content, metadata, chunkOptions);
      result = await addDocuments(chunks);
    } else {
      // Add as single document
      result = await addDocument(content, metadata);
    }

    const duration = Date.now() - startTime;
    logApiCall('POST', '/api/documents', duration);
    logRagOperation('single_document_upload_complete', {
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: chunk 
        ? `Document chunked into ${Array.isArray(result) ? result.length : 1} pieces and added`
        : 'Document added successfully',
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, 'documents_api');
    
    return NextResponse.json(
      { 
        error: 'Failed to add document',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents
 * 
 * Delete a document from the knowledge base
 * 
 * Query params:
 * - id: string - The document ID to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }

    await deleteDocument(id);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
