/**
 * Migration Script: Switch to Local Embeddings
 * 
 * This script helps you migrate from Azure OpenAI embeddings (1536D) 
 * to local Transformers.js embeddings (384D).
 * 
 * Steps:
 * 1. Run the SQL migration in Supabase
 * 2. Delete all existing documents (embeddings will be invalid)
 * 3. Re-upload documents with new embeddings
 */

import { createServerClient } from '../src/lib/supabase/client';

async function migrateToLocalEmbeddings(): Promise<void> {
  console.log('🔄 Starting migration to local embeddings...\n');
  
  const supabase = createServerClient();
  
  // Step 1: Check current documents
  const { data: documents, error: fetchError } = await supabase
    .from('documents')
    .select('id, metadata')
    .limit(10);
  
  if (fetchError) {
    console.error('❌ Error fetching documents:', fetchError.message);
    return;
  }
  
  console.log(`📊 Found ${documents?.length || 0} documents in database`);
  
  if (documents && documents.length > 0) {
    console.log('\n⚠️  WARNING: You need to delete existing documents!');
    console.log('   Old embeddings (1536D) are incompatible with new model (384D)\n');
    console.log('   To delete all documents, run:');
    console.log('   DELETE FROM documents;\n');
    console.log('   Or use the admin panel to delete documents individually.');
    return;
  }
  
  console.log('\n✅ Database is ready for local embeddings!');
  console.log('   Upload documents via the admin panel at http://localhost:3000/admin');
  console.log('   New embeddings will be generated locally using Transformers.js');
  console.log('\n📚 Model: Xenova/all-MiniLM-L6-v2 (384 dimensions)');
  console.log('🚀 Benefits: No API costs, no rate limits, works offline!');
}

// Run the migration check
migrateToLocalEmbeddings().catch(console.error);
