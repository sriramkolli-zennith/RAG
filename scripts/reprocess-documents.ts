/**
 * Reprocess Documents Script
 * 
 * This script re-chunks and re-embeds all existing documents with new chunking settings
 * Usage: npx tsx scripts/reprocess-documents.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { generateEmbedding } from '../src/lib/embeddings/local';
import { processDocument, cleanPDFText } from '../src/lib/rag/chunking';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' }); // Fallback to .env

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OriginalDocument {
  id: string;
  content: string;
  metadata: any;
}

async function getOriginalDocuments(): Promise<Map<string, OriginalDocument[]>> {
  console.log('📥 Fetching existing documents...');
  
  const { data, error } = await supabase
    .from('documents')
    .select('id, content, metadata')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  // Group by source file to reconstruct original content
  const documentsBySource = new Map<string, OriginalDocument[]>();
  
  for (const doc of data || []) {
    const source = doc.metadata?.source || 'Unknown';
    if (!documentsBySource.has(source)) {
      documentsBySource.set(source, []);
    }
    documentsBySource.get(source)!.push(doc);
  }

  console.log(`✅ Found ${data?.length || 0} chunks from ${documentsBySource.size} sources`);
  return documentsBySource;
}

async function reprocessDocument(source: string, chunks: OriginalDocument[]) {
  console.log(`\n📄 Reprocessing: ${source}`);
  console.log(`   Old chunks: ${chunks.length}`);

  // Reconstruct original content by joining all chunks
  let originalContent = chunks.map(c => c.content).join('\n\n');
  const metadata = chunks[0].metadata;

  // Clean PDF content if it's a PDF
  if (source.endsWith('.pdf')) {
    console.log('   🧹 Cleaning PDF content (removing duplicates)...');
    originalContent = cleanPDFText(originalContent);
    console.log(`   Content after cleaning: ${originalContent.length} chars`);
  }

  // Delete old chunks
  console.log('   🗑️  Deleting old chunks...');
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .in('id', chunks.map(c => c.id));

  if (deleteError) {
    console.error(`   ❌ Failed to delete old chunks: ${deleteError.message}`);
    return;
  }

  // Re-chunk with new settings
  const newChunks = processDocument(originalContent, metadata);
  console.log(`   ✨ New chunks: ${newChunks.length}`);

  // Generate embeddings and insert
  let successCount = 0;
  for (const chunk of newChunks) {
    try {
      const embedding = await generateEmbedding(chunk.content);
      
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          content: chunk.content,
          metadata: chunk.metadata,
          embedding: embedding as any,
        });

      if (insertError) {
        console.error(`   ❌ Failed to insert chunk: ${insertError.message}`);
      } else {
        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error processing chunk: ${error}`);
    }
  }

  console.log(`   ✅ Successfully inserted ${successCount}/${newChunks.length} chunks`);
}

async function main() {
  console.log('🔄 Starting document reprocessing...\n');
  console.log('📊 New chunking settings:');
  console.log('   - Chunk size: 1500 characters');
  console.log('   - Chunk overlap: 300 characters');
  console.log('   - Strategy: Section/Paragraph-based');
  console.log('   - PDF cleaning: Enabled (removes duplicates)\n');

  try {
    const documentsBySource = await getOriginalDocuments();

    if (documentsBySource.size === 0) {
      console.log('⚠️  No documents found to reprocess');
      return;
    }

    for (const [source, chunks] of documentsBySource) {
      await reprocessDocument(source, chunks);
    }

    console.log('\n✅ Reprocessing complete!');
    console.log('\n💡 Tip: Test the search with a query to verify improved results');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
