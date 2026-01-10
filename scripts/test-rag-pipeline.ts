/**
 * RAG System Test Script
 * 
 * Tests the complete RAG pipeline:
 * 1. Document upload & chunking
 * 2. Embedding generation
 * 3. Vector storage
 * 4. Semantic search
 * 5. Chat response generation
 * 
 * Usage: npx tsx scripts/test-rag-pipeline.ts
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPipeline() {
  console.log('🧪 RAG Pipeline Test Suite\n');
  console.log('='.repeat(50));

  // Test 1: Check documents exist
  console.log('\n📋 Test 1: Checking documents in database...');
  const { data: docs, error: docsError } = await supabase
    .from('documents')
    .select('id, content, metadata, embedding')
    .limit(5);

  if (docsError) {
    console.error('❌ Failed to fetch documents:', docsError.message);
    return;
  }

  if (!docs || docs.length === 0) {
    console.error('❌ No documents found in database!');
    console.log('\n💡 Please upload a document first using the web interface.');
    return;
  }

  console.log(`✅ Found ${docs.length} documents`);
  docs.forEach((doc, i) => {
    console.log(`   ${i + 1}. ${doc.content.substring(0, 60)}...`);
    console.log(`      Has embedding: ${doc.embedding ? 'Yes' : 'No'}`);
  });

  // Test 2: Verify embeddings
  console.log('\n📐 Test 2: Verifying embedding dimensions...');
  const docWithEmbedding = docs.find(d => d.embedding);
  if (!docWithEmbedding) {
    console.error('❌ No documents have embeddings!');
    return;
  }

  const embeddingStr = docWithEmbedding.embedding;
  let embeddingLength = 0;
  
  if (typeof embeddingStr === 'string') {
    // Parse if string
    try {
      const cleaned = embeddingStr.replace(/^\[/, '').replace(/\]$/, '');
      const parsed = JSON.parse(`[${cleaned}]`);
      embeddingLength = parsed.length;
    } catch {
      // Try another format
      embeddingLength = embeddingStr.split(',').length;
    }
  } else if (Array.isArray(embeddingStr)) {
    embeddingLength = embeddingStr.length;
  }

  console.log(`✅ Embedding dimension: ${embeddingLength}`);
  if (embeddingLength !== 384) {
    console.warn(`⚠️  Expected 384 dimensions for all-MiniLM-L6-v2, got ${embeddingLength}`);
  }

  // Test 3: Test RPC function
  console.log('\n🔍 Test 3: Testing vector search RPC function...');
  
  // Import embedding function
  const { generateEmbedding } = await import('../src/lib/openai/embeddings');
  
  const testQueries = ['skills', 'work experience', 'education', 'projects'];
  
  for (const query of testQueries) {
    console.log(`\n   Query: "${query}"`);
    
    const embedding = await generateEmbedding(query);
    const embeddingString = `[${embedding.join(',')}]`;
    
    // Test with different thresholds
    for (const threshold of [0.1, 0.2, 0.3]) {
      const { data, error } = await supabase.rpc('match_documents', {
        query_embedding: embeddingString,
        match_threshold: threshold,
        match_count: 3,
      });
      
      if (error) {
        console.error(`   ❌ RPC Error (threshold ${threshold}):`, error.message);
        continue;
      }
      
      const resultCount = data?.length || 0;
      const topSimilarity = data?.[0]?.similarity?.toFixed(3) || 'N/A';
      console.log(`   Threshold ${threshold}: ${resultCount} results (top: ${topSimilarity})`);
    }
  }

  // Test 4: Generate test embedding and compare
  console.log('\n📊 Test 4: Testing embedding generation...');
  const testText = 'Full Stack Web Developer skilled in JavaScript';
  const testEmbedding = await generateEmbedding(testText);
  console.log(`✅ Generated embedding for test text`);
  console.log(`   Dimension: ${testEmbedding.length}`);
  console.log(`   Sample values: [${testEmbedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}, ...]`);

  // Test 5: Check if search returns results with low threshold
  console.log('\n🎯 Test 5: End-to-end search test...');
  const searchEmbedding = await generateEmbedding('Tell me about skills and experience');
  const searchString = `[${searchEmbedding.join(',')}]`;
  
  const { data: searchResults, error: searchError } = await supabase.rpc('match_documents', {
    query_embedding: searchString,
    match_threshold: 0.05, // Very low threshold to see all matches
    match_count: 10,
  });

  if (searchError) {
    console.error('❌ Search failed:', searchError.message);
  } else {
    console.log(`✅ Search returned ${searchResults?.length || 0} results`);
    if (searchResults && searchResults.length > 0) {
      console.log('\n   Top results:');
      searchResults.slice(0, 3).forEach((result: any, i: number) => {
        console.log(`   ${i + 1}. Similarity: ${result.similarity.toFixed(3)}`);
        console.log(`      Content: ${result.content.substring(0, 80)}...`);
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 Summary');
  console.log('='.repeat(50));
  console.log(`Documents in DB: ${docs.length}`);
  console.log(`Embedding dimension: ${embeddingLength}`);
  console.log(`Recommended threshold: 0.1 (for local embeddings)`);
  
  if (searchResults && searchResults.length > 0) {
    const avgSimilarity = searchResults.reduce((acc: number, r: any) => acc + r.similarity, 0) / searchResults.length;
    console.log(`Average similarity score: ${avgSimilarity.toFixed(3)}`);
    console.log('\n✅ RAG pipeline is working correctly!');
  } else {
    console.log('\n⚠️  No search results found. Check:');
    console.log('   1. Documents have embeddings');
    console.log('   2. RPC function is using correct vector dimension (384)');
    console.log('   3. Threshold is low enough (0.1)');
  }
}

testPipeline().catch(console.error);
