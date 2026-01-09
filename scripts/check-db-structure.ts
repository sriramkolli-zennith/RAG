import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseStructure() {
  console.log('\n=== Checking Database Structure ===\n');

  // Check the embedding column type
  console.log('1. Checking embedding column type...');
  const { data: columnInfo, error: columnError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT 
          column_name, 
          data_type, 
          udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'documents' 
          AND column_name = 'embedding';
      `
    })
    .single();

  if (columnError) {
    console.log('❌ Cannot query column info (exec_sql function may not exist)');
    console.log('Error:', columnError.message);
    console.log('\n💡 Manual check needed:');
    console.log('Go to Supabase Dashboard → SQL Editor and run:');
    console.log(`
SELECT 
  column_name, 
  data_type, 
  udt_name,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND column_name = 'embedding';
    `.trim());
  } else {
    console.log('✅ Column info:', columnInfo);
  }

  // Check if match_documents function exists
  console.log('\n2. Checking match_documents function...');
  const { data: functionInfo, error: functionError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT 
          routine_name,
          data_type as return_type
        FROM information_schema.routines
        WHERE routine_name = 'match_documents'
          AND routine_schema = 'public';
      `
    });

  if (functionError) {
    console.log('❌ Cannot query function info');
    console.log('Error:', functionError.message);
  } else {
    console.log('✅ Function exists:', functionInfo);
  }

  // Try to get a sample document
  console.log('\n3. Getting sample document...');
  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('id, content, embedding')
    .limit(1)
    .single();

  if (docsError) {
    console.log('❌ Cannot fetch documents');
    console.log('Error:', docsError.message);
  } else {
    const embeddingType = typeof docs.embedding;
    let embeddingLength = 0;
    
    try {
      if (embeddingType === 'string') {
        const parsed = JSON.parse(docs.embedding);
        embeddingLength = Array.isArray(parsed) ? parsed.length : 0;
      } else if (Array.isArray(docs.embedding)) {
        embeddingLength = docs.embedding.length;
      }
    } catch (e) {
      console.log('⚠️  Could not parse embedding');
    }

    console.log('✅ Sample document:');
    console.log(`   ID: ${docs.id}`);
    console.log(`   Content: ${docs.content.substring(0, 50)}...`);
    console.log(`   Embedding Type: ${embeddingType}`);
    console.log(`   Embedding Length: ${embeddingLength}`);
  }

  console.log('\n=== Next Steps ===\n');
  console.log('If embedding column is NOT vector(384):');
  console.log('1. Go to Supabase SQL Editor');
  console.log('2. Run the migration: supabase/migrations/003_switch_to_local_embeddings.sql');
  console.log('3. Or manually run:');
  console.log('   ALTER TABLE documents ALTER COLUMN embedding TYPE VECTOR(384) USING embedding::vector(384);');
  console.log('\nIf the column IS vector(384) but search still fails:');
  console.log('1. The data might need to be re-inserted');
  console.log('2. Try: DELETE FROM documents; then re-upload documents');
}

checkDatabaseStructure().catch(console.error);
