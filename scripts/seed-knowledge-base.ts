/**
 * Seed Script for Knowledge Base
 * 
 * Run this script to populate your vector database with sample documents.
 * Usage: npm run seed
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Sample knowledge base documents
const sampleDocuments = [
  {
    content: `# RAG Overview
RAG (Retrieval-Augmented Generation) is an AI framework that combines information retrieval 
with text generation. It enhances LLM responses by first retrieving relevant documents from 
a knowledge base, then using those documents as context for generating accurate, grounded 
responses. This approach reduces hallucinations and allows LLMs to access up-to-date or 
domain-specific information.`,
    metadata: { source: 'RAG Documentation', type: 'markdown' }
  },
  {
    content: `# Vector Databases
Vector databases are specialized databases designed to store and query high-dimensional vectors.
These vectors are numerical representations (embeddings) of data like text, images, or audio.
They enable similarity search - finding items that are semantically similar rather than 
exact matches. Popular vector databases include Pinecone, Weaviate, Milvus, and pgvector 
(PostgreSQL extension).`,
    metadata: { source: 'Vector DB Guide', type: 'markdown' }
  },
  {
    content: `# Embeddings Explained
Embeddings are dense vector representations that capture the semantic meaning of content.
When text is converted to an embedding, similar concepts end up close together in vector space.
For example, "dog" and "puppy" would have embeddings that are very similar (small distance).
OpenAI's text-embedding-ada-002 model creates 1536-dimensional vectors that excel at 
capturing semantic relationships.`,
    metadata: { source: 'Embeddings Guide', type: 'markdown' }
  },
  {
    content: `# Cosine Similarity
Cosine similarity is a metric used to measure how similar two vectors are. It calculates 
the cosine of the angle between two vectors in a multi-dimensional space. A value of 1 
means the vectors are identical in direction (very similar content), while 0 means they 
are orthogonal (unrelated). In RAG systems, we use cosine similarity to find documents 
most relevant to a user's query.`,
    metadata: { source: 'Math Concepts', type: 'markdown' }
  },
  {
    content: `# Next.js App Router
Next.js is a React framework that provides server-side rendering, routing, and API routes.
The App Router (introduced in Next.js 13) uses a file-system based router where folders 
define routes. It supports server components by default, which can directly access databases
and APIs. API routes are defined in the app/api folder and handle HTTP requests.`,
    metadata: { source: 'Next.js Guide', type: 'markdown' }
  },
  {
    content: `# Supabase and pgvector
Supabase is an open-source Firebase alternative that provides a PostgreSQL database with
built-in authentication, storage, and real-time subscriptions. The pgvector extension 
enables vector operations in PostgreSQL, making it possible to store embeddings and 
perform similarity searches directly in your database. This combination is powerful 
for building RAG applications without needing a separate vector database service.`,
    metadata: { source: 'Supabase Guide', type: 'markdown' }
  },
  {
    content: `# Chunking Strategies
When processing documents for a RAG system, large texts must be split into smaller chunks.
Common strategies include:
- Fixed-size chunking: Split by character count with overlap
- Semantic chunking: Split by paragraphs or sections
- Sentence-based: Split on sentence boundaries
- Recursive: Hierarchically split by separators
The chunk size affects retrieval precision - smaller chunks are more precise but may 
lose context, while larger chunks preserve context but may include irrelevant information.`,
    metadata: { source: 'Chunking Guide', type: 'markdown' }
  },
  {
    content: `# The RAG Pipeline
A complete RAG pipeline consists of two phases:
1. Indexing Phase:
   - Collect documents from various sources
   - Clean and preprocess text
   - Split into chunks
   - Generate embeddings for each chunk
   - Store in vector database
2. Query Phase:
   - User asks a question
   - Generate embedding for the question
   - Search vector database for similar chunks
   - Retrieve top-k relevant chunks
   - Construct prompt with context
   - Send to LLM for response generation`,
    metadata: { source: 'RAG Pipeline', type: 'markdown' }
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.replace(/\n/g, ' '),
  });
  return response.data[0].embedding;
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...\n');

  for (let i = 0; i < sampleDocuments.length; i++) {
    const doc = sampleDocuments[i];
    console.log(`📄 Processing document ${i + 1}/${sampleDocuments.length}: ${doc.metadata.source}`);

    try {
      // Generate embedding
      const embedding = await generateEmbedding(doc.content);
      console.log(`   ✅ Generated embedding (${embedding.length} dimensions)`);

      // Insert into database
      const { error } = await supabase
        .from('documents')
        .insert({
          content: doc.content,
          metadata: doc.metadata,
          embedding: embedding,
        });

      if (error) {
        console.error(`   ❌ Error inserting: ${error.message}`);
      } else {
        console.log(`   ✅ Inserted into database`);
      }
    } catch (error) {
      console.error(`   ❌ Error processing: ${error}`);
    }

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n🎉 Database seeding complete!');
}

seedDatabase().catch(console.error);
