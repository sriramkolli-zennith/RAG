# 🔄 Building the RAG Pipeline

## Overview

The RAG pipeline has two phases:
1. **Indexing Phase**: Prepare and store documents
2. **Query Phase**: Retrieve and generate responses

This guide walks through implementing both.

## Phase 1: Indexing Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      INDEXING PIPELINE                                   │
│                                                                         │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌──────────┐ │
│  │         │   │         │   │         │   │         │   │          │ │
│  │ COLLECT │──▶│  CLEAN  │──▶│  CHUNK  │──▶│  EMBED  │──▶│  STORE   │ │
│  │         │   │         │   │         │   │         │   │          │ │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └──────────┘ │
│      │             │             │             │              │        │
│      ▼             ▼             ▼             ▼              ▼        │
│   PDFs,         Remove        Split        Generate        Save to    │
│   docs,         noise,        into         vector          vector     │
│   URLs          format        pieces       embeddings      database   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Collect Documents

Gather your knowledge base from various sources:

```typescript
// Example: Reading from different sources
const sources = [
  { type: 'file', path: './docs/faq.md' },
  { type: 'url', path: 'https://example.com/docs' },
  { type: 'text', content: 'Direct text input...' },
];
```

### Step 2: Clean and Preprocess

Remove noise and normalize text:

```typescript
function cleanText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove special characters that don't add meaning
    .replace(/[^\w\s.,!?-]/g, '')
    // Normalize line breaks
    .replace(/\n+/g, '\n')
    .trim();
}
```

### Step 3: Chunk Documents

Split large documents into smaller pieces:

```typescript
interface ChunkOptions {
  chunkSize: number;    // Target size of each chunk
  chunkOverlap: number; // Overlap between chunks
}

function splitIntoChunks(text: string, options: ChunkOptions): string[] {
  const { chunkSize, chunkOverlap } = options;
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    // Try to end at a sentence boundary
    let end = start + chunkSize;
    
    if (end < text.length) {
      const sentenceEnd = text.lastIndexOf('. ', end);
      if (sentenceEnd > start + chunkSize / 2) {
        end = sentenceEnd + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - chunkOverlap;
  }
  
  return chunks;
}
```

#### Chunking Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| Fixed-size | Split by character count | General use |
| Sentence | Split on sentence boundaries | Narrative text |
| Paragraph | Split on paragraph breaks | Structured docs |
| Semantic | Split by topic/section | Technical docs |
| Recursive | Try multiple separators | Mixed content |

#### Optimal Chunk Sizes

| Chunk Size | Trade-off |
|------------|-----------|
| 200-500 chars | High precision, less context |
| 500-1000 chars | Balanced (recommended) |
| 1000-2000 chars | More context, less precision |

### Step 4: Generate Embeddings

Convert each chunk to a vector using **local embeddings** (free, no API):

```typescript
// src/lib/embeddings/local.ts
import { pipeline } from '@xenova/transformers';

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';  // 384 dimensions

export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await pipeline('feature-extraction', MODEL_NAME);
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data) as number[];  // 384 numbers
}

// Process chunks in batches
async function embedChunks(chunks: string[]): Promise<number[][]> {
  return Promise.all(chunks.map(chunk => generateEmbedding(chunk)));
}
```

**Note**: Our project uses local Transformers.js embeddings (384D) instead of OpenAI (1536D) - completely free!
```

### Step 5: Store in Vector Database

Save chunks with their embeddings:

```typescript
async function storeDocuments(
  chunks: string[],
  embeddings: number[][],
  metadata: Record<string, unknown>
): Promise<void> {
  const supabase = createClient(url, key);
  
  const documents = chunks.map((content, index) => ({
    content,
    embedding: embeddings[index],
    metadata: { ...metadata, chunkIndex: index },
  }));
  
  await supabase.from('documents').insert(documents);
}
```

### Complete Indexing Function

```typescript
async function indexDocument(
  content: string,
  metadata: Record<string, unknown>
): Promise<void> {
  // 1. Clean
  const cleaned = cleanText(content);
  
  // 2. Chunk
  const chunks = splitIntoChunks(cleaned, {
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  
  // 3. Embed
  const embeddings = await embedChunks(chunks);
  
  // 4. Store
  await storeDocuments(chunks, embeddings, metadata);
  
  console.log(`Indexed ${chunks.length} chunks`);
}
```

## Phase 2: Query Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       QUERY PIPELINE                                     │
│                                                                         │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌──────────┐ │
│  │         │   │         │   │         │   │         │   │          │ │
│  │  QUERY  │──▶│  EMBED  │──▶│ RETRIEVE│──▶│ AUGMENT │──▶│ GENERATE │ │
│  │         │   │         │   │         │   │         │   │          │ │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └──────────┘ │
│      │             │             │             │              │        │
│      ▼             ▼             ▼             ▼              ▼        │
│   User's       Convert to     Find          Build          Send to    │
│   question     embedding      similar       prompt         LLM        │
│                               docs          with context              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Receive Query

```typescript
const userQuery = "What is the refund policy?";
```

### Step 2: Embed the Query

```typescript
const queryEmbedding = await generateEmbedding(userQuery);
```

### Step 3: Retrieve Relevant Documents

```typescript
// src/lib/rag/vector-store.ts
async function searchDocuments(
  query: string,
  matchThreshold: number = 0.1,  // Lower for local embeddings
  matchCount: number = 5
): Promise<SearchResult[]> {
  const supabase = createServerClient();
  
  // Generate embedding locally (384D)
  const queryEmbedding = await generateEmbedding(query);
  
  // Format as PostgreSQL vector string
  const embeddingString = `[${queryEmbedding.join(',')}]`;
  
  // Call RPC function
  const { data } = await supabase.rpc('match_documents', {
    query_embedding: embeddingString,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });
  
  return data;
}
```

**Important**: Local embeddings produce lower similarity scores (0.1-0.5) compared to OpenAI (0.7-0.95). Use threshold of 0.1-0.3.
```

### Step 4: Augment the Prompt

```typescript
function buildPrompt(query: string, documents: Array<{ content: string }>): string {
  const context = documents
    .map((doc, i) => `[${i + 1}] ${doc.content}`)
    .join('\n\n');
  
  return `You are a helpful assistant. Answer based on the provided context.

Context:
${context}

Question: ${query}

Answer based only on the context above. If the answer is not in the context, say so.`;
}
```

### Step 5: Generate Response

```typescript
async function generateResponse(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1000,
    temperature: 0.7,
  });
  
  return response.choices[0].message.content;
}
```

### Complete Query Function

```typescript
async function query(userQuery: string): Promise<{
  answer: string;
  sources: Array<{ content: string; similarity: number }>;
}> {
  // 1. Embed query
  const queryEmbedding = await generateEmbedding(userQuery);
  
  // 2. Retrieve
  const documents = await retrieveDocuments(queryEmbedding, {
    threshold: 0.7,
    limit: 5,
  });
  
  // 3. Augment
  const prompt = buildPrompt(userQuery, documents);
  
  // 4. Generate
  const answer = await generateResponse(prompt);
  
  return { answer, sources: documents };
}
```

## The System Prompt

Our actual system prompt (from `src/lib/rag/engine.ts`):

```typescript
const SYSTEM_PROMPT = `You are a helpful knowledge base assistant. Your job is to answer questions based on the provided context from the knowledge base.

GUIDELINES:
1. Use the provided documents to answer questions as accurately as possible
2. If the context contains relevant information, use it to formulate a helpful response
3. If the documents contain partial information, share what you found and note any gaps
4. When citing information, reference the document number (e.g., "According to Document 1...")
5. If the context genuinely doesn't contain ANY relevant information, say: "I couldn't find information about this in the knowledge base."
6. Be helpful and conversational while staying grounded in the provided context
7. If information spans multiple documents, synthesize it into a coherent answer

Remember: The user has uploaded documents to this knowledge base, so try your best to find and present relevant information from the context provided.`;
```

## Advanced: Conversation History

Maintain context across multiple turns:

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

async function chatWithHistory(
  userQuery: string,
  history: Message[]
): Promise<string> {
  // Retrieve relevant docs
  const queryEmbedding = await generateEmbedding(userQuery);
  const documents = await retrieveDocuments(queryEmbedding, {
    threshold: 0.7,
    limit: 5,
  });
  
  // Build messages with history
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,  // Previous conversation
    {
      role: 'user',
      content: buildPrompt(userQuery, documents),
    },
  ];
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    max_tokens: 1000,
  });
  
  return response.choices[0].message.content;
}
```

## Streaming Responses

For better UX, stream responses token by token:

```typescript
async function* streamQuery(userQuery: string): AsyncGenerator<string> {
  const queryEmbedding = await generateEmbedding(userQuery);
  const documents = await retrieveDocuments(queryEmbedding, { threshold: 0.7, limit: 5 });
  const prompt = buildPrompt(userQuery, documents);
  
  const stream = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    stream: true,
  });
  
  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content;
    if (token) {
      yield token;
    }
  }
}

// Usage
for await (const token of streamQuery("What is RAG?")) {
  process.stdout.write(token);
}
```

## Evaluation Metrics

How do you know if your RAG is working well?

### Retrieval Metrics

| Metric | Description |
|--------|-------------|
| **Precision** | % of retrieved docs that are relevant |
| **Recall** | % of relevant docs that were retrieved |
| **MRR** | Mean Reciprocal Rank of first relevant doc |

### Generation Metrics

| Metric | Description |
|--------|-------------|
| **Faithfulness** | Does the answer match the context? |
| **Relevance** | Does the answer address the question? |
| **Coherence** | Is the answer well-structured? |

## Common Issues & Solutions

### Issue: Irrelevant Results
**Solution**: Increase similarity threshold or improve chunking

```typescript
// Increase threshold
const documents = await retrieveDocuments(queryEmbedding, {
  threshold: 0.8,  // Was 0.7
  limit: 5,
});
```

### Issue: Missing Information
**Solution**: Decrease threshold or increase limit

```typescript
const documents = await retrieveDocuments(queryEmbedding, {
  threshold: 0.6,  // Was 0.7
  limit: 10,       // Was 5
});
```

### Issue: Hallucinations
**Solution**: Strengthen the system prompt

```typescript
const SYSTEM_PROMPT = `...
CRITICAL: If the context does not contain the answer, 
respond with "I cannot find this information in the knowledge base."
Do NOT make up information.
...`;
```

## In Our Project

The RAG engine is in [src/lib/rag/engine.ts](../src/lib/rag/engine.ts):

```typescript
import { chat, streamChat } from '@/lib/rag';

// Simple query with options
const response = await chat("What is RAG?", sessionId, {
  matchThreshold: 0.1,  // Lower for local embeddings
  matchCount: 5,
  includeHistory: true,
});
console.log(response.answer);
console.log(response.sources);

// Streaming query
for await (const chunk of streamChat("What is RAG?", sessionId)) {
  if (chunk.type === 'sources') {
    console.log('Sources:', chunk.data);
  } else if (chunk.type === 'token') {
    process.stdout.write(chunk.data);
  }
}
```

### Key Implementation Details

| Aspect | Our Implementation |
|--------|-------------------|
| **Embeddings** | Local (Transformers.js, 384D) |
| **Chat Model** | Azure OpenAI (GPT-4o-mini) |
| **Threshold** | 0.1 (default for local) |
| **Chunk Size** | 1500 chars with 300 overlap |
| **History** | Stored in Supabase |

## Key Takeaways

1. **Two phases**: Indexing (prepare) and Query (retrieve+generate)
2. **Chunking matters**: Balance between precision and context
3. **Prompt engineering**: Guide the LLM with clear instructions
4. **History support**: Maintain conversation context
5. **Streaming**: Better UX for real-time responses

---

[← Previous: Vector Databases](03-vector-databases.md) | [Next: API Reference →](05-api-reference.md)
