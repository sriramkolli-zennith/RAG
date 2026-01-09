import { NextRequest, NextResponse } from 'next/server';
import { addDocuments } from '@/lib/rag';
import { processDocument } from '@/lib/rag/chunking';
import { logApiCall, logRagOperation } from '@/lib/logger';
import PDFParser from 'pdf2json';

/**
 * Extract text from PDF using pdf2json (for PDFs with text layers)
 * This is fast and free - works for most digital PDFs
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(null, 1);
    
    pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError));
    pdfParser.on('pdfParser_dataReady', () => {
      const textContent = (pdfParser as any).getRawTextContent();
      resolve(textContent);
    });
    
    pdfParser.parseBuffer(buffer);
  });
}

/**
 * Check if extracted text is meaningful (not just whitespace/garbage)
 */
function isValidExtractedText(text: string): boolean {
  // Remove whitespace and check if we have meaningful content
  const cleanText = text.replace(/\s+/g, ' ').trim();
  // Should have at least 50 chars of actual text and contain some letters
  return cleanText.length > 50 && /[a-zA-Z]{3,}/.test(cleanText);
}

/**
 * POST /api/documents/upload
 * 
 * Upload and process files (including PDFs) with text extraction
 * Uses pdf2json for digital PDFs (fast, free)
 * 
 * For scanned PDFs/images, consider adding OCR support with Google Vision:
 * - Set GOOGLE_APPLICATION_CREDENTIALS in .env
 * - Install @google-cloud/vision
 * - Use vision.ImageAnnotatorClient for OCR
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    logRagOperation('batch_upload_start', {
      count: files.length,
    });

    // Extract text from each file
    const documents = await Promise.all(
      files.map(async (file) => {
        let text: string;

        if (file.type === 'application/pdf') {
          // Extract text from PDF using pdf2json
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          text = await extractTextFromPDF(buffer);
          
          // Check if extraction was successful
          if (!isValidExtractedText(text)) {
            console.warn(`[Upload] PDF "${file.name}" may be scanned/image-based. Consider using OCR.`);
            // Still use what we got, but log the warning
          }
        } else {
          // Read as plain text
          text = await file.text();
        }

        return {
          content: text,
          source: file.name,
        };
      })
    );

    // Process and chunk each document
    const chunkedDocuments = documents.flatMap(doc => 
      processDocument(doc.content, { source: doc.source })
    );

    logRagOperation('batch_chunking_complete', {
      originalCount: documents.length,
      chunkedCount: chunkedDocuments.length,
    });

    // Add chunked documents
    const results = await addDocuments(chunkedDocuments);

    const duration = Date.now() - startTime;
    logApiCall('POST', '/api/documents/upload', duration);
    logRagOperation('batch_upload_complete', {
      count: results.length,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully uploaded ${results.length} document chunks from ${files.length} files`,
        count: results.length,
        documentIds: results.map(d => d.id),
      },
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    console.error('Upload error:', errorObj);
    
    return NextResponse.json(
      { 
        error: 'Failed to upload documents',
        message: process.env.NODE_ENV === 'development' ? errorObj.message : undefined,
      },
      { status: 500 }
    );
  }
}
