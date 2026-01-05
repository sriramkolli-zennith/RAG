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
  chunkSize: 1000,
  chunkOverlap: 200,
};

/**
 * Split text into overlapping chunks
 * 
 * This simple approach splits on character count with overlap.
 * For production, consider splitting on:
 * - Sentence boundaries
 * - Paragraph boundaries
 * - Semantic sections
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
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to end at a sentence or paragraph boundary
    if (end < text.length) {
      // Look for paragraph break
      const paragraphBreak = text.lastIndexOf('\n\n', end);
      if (paragraphBreak > start + chunkSize / 2) {
        end = paragraphBreak;
      } else {
        // Look for sentence end
        const sentenceEnd = text.lastIndexOf('. ', end);
        if (sentenceEnd > start + chunkSize / 2) {
          end = sentenceEnd + 1;
        }
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - chunkOverlap;
    
    // Make sure we're making progress
    if (start >= end) {
      start = end;
    }
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
  const isMarkdown = (metadata.type === 'markdown') || 
                     (typeof metadata.filename === 'string' && metadata.filename.endsWith('.md'));
  
  const chunks = isMarkdown 
    ? splitMarkdownIntoChunks(content, options)
    : splitTextIntoChunks(content, options);

  return chunks.map((chunk, index) => ({
    content: chunk,
    metadata: {
      ...metadata,
      chunkIndex: index,
      totalChunks: chunks.length,
    },
  }));
}
