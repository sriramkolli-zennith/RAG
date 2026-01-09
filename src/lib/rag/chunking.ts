/**
 * Text Chunking Utilities
 * 
 * When adding documents to the knowledge base, large documents need to be
 * split into smaller chunks. This is important because:
 * 
 * 1. Embedding models have token limits
 * 2. Smaller chunks provide more precise retrieval
 * 3. LLMs have context window limits
 * 
 * The key challenge is splitting while preserving meaning and context.
 */

/**
 * Sanitize text content to remove problematic Unicode characters
 */
function sanitizeContent(text: string): string {
  // Replace null bytes and other problematic characters
  return text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except \n, \r, \t
    .replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return '';
      }
    })
    .trim();
}

/**
 * Clean PDF-extracted text by removing duplicate lines and normalizing whitespace
 * PDF extractors often produce duplicated lines due to how PDFs store text
 */
export function cleanPDFText(text: string): string {
  // Split into lines
  const lines = text.split('\n');
  const cleanedLines: string[] = [];
  let previousLine = '';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines and duplicate consecutive lines
    if (trimmedLine.length === 0) {
      // Add a single blank line for paragraph breaks
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
        cleanedLines.push('');
      }
      continue;
    }
    
    // Skip if this line is the same as the previous line (duplicate)
    if (trimmedLine === previousLine) {
      continue;
    }
    
    // Skip page break markers
    if (trimmedLine.includes('----------------Page') && trimmedLine.includes('Break----------------')) {
      continue;
    }
    
    cleanedLines.push(trimmedLine);
    previousLine = trimmedLine;
  }
  
  // Join lines and normalize
  let result = cleanedLines.join('\n');
  
  // Fix broken words/phrases caused by PDF column extraction
  // Join lines that don't end with proper sentence terminators and next line doesn't start with capital/bullet
  result = result.replace(/([a-z,])\n([a-z])/g, '$1 $2');
  
  // Normalize multiple spaces
  result = result.replace(/ {2,}/g, ' ');
  
  // Normalize multiple blank lines to single paragraph breaks
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result.trim();
}

export interface ChunkOptions {
  /**
   * Maximum size of each chunk in characters
   * Smaller = more precise but may lose context
   * Larger = more context but may include irrelevant info
   */
  chunkSize: number;
  
  /**
   * Overlap between chunks in characters
   * Helps preserve context at chunk boundaries
   */
  chunkOverlap: number;
}

const DEFAULT_OPTIONS: ChunkOptions = {
  chunkSize: 1500,
  chunkOverlap: 300,
};

/**
 * Split text into overlapping chunks by sections/paragraphs
 * 
 * This approach:
 * - Splits on paragraph boundaries (double newlines)
 * - Maintains section integrity (keeps headers with their content)
 * - Provides overlap using previous content for context continuity
 * - Preserves semantic meaning better than character-based splitting
 */
export function splitTextIntoChunks(
  text: string,
  options: Partial<ChunkOptions> = {}
): string[] {
  const { chunkSize, chunkOverlap } = { ...DEFAULT_OPTIONS, ...options };
  
  if (text.length <= chunkSize) {
    return [text];
  }

  const chunks: string[] = [];

  // Split into paragraphs using double newlines (real paragraph breaks)
  // This preserves sections like "Skills", "Work Experience" together
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  let currentChunk = '';
  let previousParagraphs: string[] = [];

  for (const paragraph of paragraphs) {
    const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;

    if (potentialChunk.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      chunks.push(currentChunk.trim());

      // Start new chunk with overlap (include previous paragraphs for context)
      const overlapText = previousParagraphs.slice(-2).join('\n\n');
      currentChunk = overlapText + (overlapText ? '\n\n' : '') + paragraph;
      previousParagraphs = [paragraph];
    } else {
      currentChunk = potentialChunk;
      previousParagraphs.push(paragraph);
    }
  }

  // Add the final chunk if it has content
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Split markdown content intelligently
 * Respects headers and code blocks
 */
export function splitMarkdownIntoChunks(
  markdown: string,
  options: Partial<ChunkOptions> = {}
): string[] {
  const { chunkSize, chunkOverlap } = { ...DEFAULT_OPTIONS, ...options };
  
  // Split by headers first
  const sections = markdown.split(/(?=^#{1,6}\s)/m);
  const chunks: string[] = [];
  
  for (const section of sections) {
    if (section.length <= chunkSize) {
      chunks.push(section.trim());
    } else {
      // Split large sections further
      const subChunks = splitTextIntoChunks(section, { chunkSize, chunkOverlap });
      chunks.push(...subChunks);
    }
  }
  
  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Process a document for ingestion into the vector store
 * Returns chunks with metadata
 */
export function processDocument(
  content: string,
  metadata: Record<string, unknown> = {},
  options: Partial<ChunkOptions> = {}
): Array<{ content: string; metadata: Record<string, unknown> }> {
  // Sanitize content first
  let processedContent = sanitizeContent(content);
  
  // Check if this is PDF content (has duplicate lines pattern or page breaks)
  const isPDF = (typeof metadata.source === 'string' && metadata.source.endsWith('.pdf')) ||
                content.includes('----------------Page') ||
                /^(.+)\n\1$/m.test(content); // Detects duplicate consecutive lines
  
  if (isPDF) {
    processedContent = cleanPDFText(processedContent);
  }
  
  const isMarkdown = (metadata.type === 'markdown') || 
                     (typeof metadata.filename === 'string' && metadata.filename.endsWith('.md'));
  
  const chunks = isMarkdown 
    ? splitMarkdownIntoChunks(processedContent, options)
    : splitTextIntoChunks(processedContent, options);

  return chunks.map((chunk, index) => ({
    content: sanitizeContent(chunk),
    metadata: {
      ...metadata,
      chunkIndex: index,
      totalChunks: chunks.length,
    },
  }));
}
