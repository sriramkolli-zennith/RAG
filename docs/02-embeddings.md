# 🔢 Understanding Embeddings

## What Are Embeddings?

**Embeddings** are numerical representations of content (text, images, audio) that capture semantic meaning. They convert human-understandable content into a format that machines can compare and analyze.

## The Key Insight

Similar content produces similar embeddings. This simple idea powers semantic search, recommendation systems, and RAG.

```
"I love dogs"     → [0.2, 0.8, 0.1, ...]  ─┐
                                           ├── Similar vectors (small distance)
"I adore puppies" → [0.3, 0.7, 0.2, ...]  ─┘

"The weather is nice" → [0.9, 0.1, 0.4, ...] ← Very different vector (large distance)
```

## How Text Becomes Numbers

### Step 1: Tokenization
Text is broken into tokens (words or subwords):

```
"Hello, how are you?" → ["Hello", ",", "how", "are", "you", "?"]
```

### Step 2: Neural Network Processing
Each token is processed through a neural network that has learned semantic relationships from massive amounts of text.

### Step 3: Vector Output
The model outputs a fixed-size vector (array of numbers) representing the meaning:

```javascript
// OpenAI's text-embedding-ada-002 produces 1536 dimensions
const embedding = [
  -0.006929283,
  -0.005336422,
  -0.024719927,
  // ... 1533 more numbers
];
```

## Visualizing Embeddings

Imagine a 3D space where words are positioned by meaning:

```
                        ▲ (furry animals)
                        │
                   🐕 dog
                  🐩 puppy
                 🐈 cat
                        │
    ────────────────────┼────────────────────▶ (actions)
        🚗 car          │           🏃 run
        🚌 bus          │          🏊 swim
                        │
                        │
                        ▼ (vehicles)
```

Real embeddings have 1536 dimensions, but the principle is the same!

## Embedding Models

Different models produce different embeddings:

| Model | Dimensions | Provider | Best For |
|-------|------------|----------|----------|
| **all-MiniLM-L6-v2** | **384** | **Transformers.js** | **This project (Local, Free)** |
| text-embedding-ada-002 | 1536 | OpenAI | General purpose |
| text-embedding-3-small | 1536 | OpenAI | Cost-effective |
| text-embedding-3-large | 3072 | OpenAI | Highest quality |
| Cohere embed-v3 | 1024 | Cohere | Multilingual |

> **This Project**: Uses `all-MiniLM-L6-v2` locally via Transformers.js - no API costs, no rate limits!

## Working with Embeddings in Code

### Our Local Embedding Implementation

```typescript
// src/lib/embeddings/local.ts
import { pipeline } from '@xenova/transformers';

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
let embeddingPipeline: any = null;

async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('[Embeddings] Loading local embedding model...');
    embeddingPipeline = await pipeline('feature-extraction', MODEL_NAME);
  }
  return embeddingPipeline;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanedText = text.replace(/\n/g, ' ').trim();
  const extractor = await getEmbeddingPipeline();
  const output = await extractor(cleanedText, { pooling: 'mean', normalize: true });
  return Array.from(output.data) as number[]; // Array of 384 numbers
}

// Usage
const embedding = await generateEmbedding("What is machine learning?");
console.log(`Vector dimensions: ${embedding.length}`); // 384
```

### Comparing Embeddings

Two embeddings can be compared using **cosine similarity**:

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Compare two texts
const emb1 = await generateEmbedding("I love programming");
const emb2 = await generateEmbedding("Coding is my passion");
const emb3 = await generateEmbedding("The weather is sunny");

console.log(cosineSimilarity(emb1, emb2)); // ~0.92 (very similar)
console.log(cosineSimilarity(emb1, emb3)); // ~0.45 (not related)
```

## Cosine Similarity Explained

Cosine similarity measures the angle between two vectors:

```
        Vector A
        ↗
       /  θ (angle)
      /____→ Vector B

cos(θ) = (A · B) / (||A|| × ||B||)
```

| Similarity | Meaning |
|------------|---------|
| 1.0 | Identical meaning |
| 0.9+ | Very similar |
| 0.7-0.9 | Related |
| 0.5-0.7 | Somewhat related |
| < 0.5 | Unrelated |

## Why 384 Dimensions?

Our project uses 384 dimensions (all-MiniLM-L6-v2) instead of 1536 (OpenAI):

| Aspect | 384 Dimensions | 1536 Dimensions |
|--------|----------------|-----------------|
| **Model** | all-MiniLM-L6-v2 | OpenAI ada-002 |
| **Speed** | ~50-100ms | ~200-500ms |
| **Cost** | Free (local) | $0.10/1M tokens |
| **Quality** | ~90-95% of OpenAI | Baseline |
| **Offline** | ✅ Yes | ❌ No |

More dimensions = more nuance, but 384 is excellent for most use cases!

Think of it like describing a person:

| Dimensions | Description |
|------------|-------------|
| 2 | Tall, Short |
| 5 | Tall, Short, Old, Young, Friendly |
| 100 | Height, Age, Personality traits, Hobbies, ... |
| 384 | Captures semantic meaning effectively! |
| 1536 | Maximum nuance (often overkill) |

## Practical Considerations

### Token Limits
Embedding models have maximum input sizes:
- all-MiniLM-L6-v2: ~512 tokens (~400 words)
- ada-002: 8,191 tokens (~6,000 words)
- For longer texts, you must chunk first (our chunking.ts handles this)

### Batch Processing
Process multiple texts efficiently:

```typescript
// src/lib/embeddings/local.ts
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const cleanedTexts = texts.map(text => text.replace(/\n/g, ' ').trim());
  
  // Check cache first, process uncached in batch
  const results: (number[] | null)[] = new Array(cleanedTexts.length).fill(null);
  const uncachedTexts: string[] = [];
  
  cleanedTexts.forEach((text, index) => {
    const cached = embeddingCache.get(getCacheKey(text));
    if (cached) results[index] = cached;
    else uncachedTexts.push(text);
  });
  
  // Generate uncached embeddings
  if (uncachedTexts.length > 0) {
    const extractor = await getEmbeddingPipeline();
    // Process batch through model...
  }
  
  return results as number[][];
}
```

### Cost Considerations (Why We Use Local)
| Model | Price per 1M tokens |
|-------|---------------------|
| **all-MiniLM-L6-v2 (Local)** | **$0.00** |
| text-embedding-ada-002 | $0.10 |
| text-embedding-3-small | $0.02 |
| text-embedding-3-large | $0.13 |

**Our Choice**: Free local embeddings + Azure OpenAI only for chat completions = optimal cost!

## Common Pitfalls

### 1. Inconsistent Embedding Models
Always use the same model for indexing and querying!

```typescript
// ❌ BAD - Different models produce incompatible vectors
const docEmbedding = await embed("doc", "text-embedding-ada-002");
const queryEmbedding = await embed("query", "text-embedding-3-small");

// ✅ GOOD - Same model for both
const docEmbedding = await embed("doc", "text-embedding-ada-002");
const queryEmbedding = await embed("query", "text-embedding-ada-002");
```

### 2. Not Normalizing Input
Clean your text before embedding:

```typescript
function cleanText(text: string): string {
  return text
    .replace(/\n+/g, ' ')      // Remove newlines
    .replace(/\s+/g, ' ')      // Collapse whitespace
    .trim();                    // Remove leading/trailing space
}
```

### 3. Embedding Empty Strings
Always validate input:

```typescript
if (!text || text.trim().length === 0) {
  throw new Error('Cannot embed empty text');
}
```

## Embedding Visualization Tools

Want to see your embeddings? These tools project high-dimensional vectors into 2D/3D:

- **TensorFlow Embedding Projector**: https://projector.tensorflow.org
- **UMAP**: Uniform Manifold Approximation and Projection
- **t-SNE**: t-distributed Stochastic Neighbor Embedding

## Key Takeaways

1. **Embeddings capture meaning** - Similar text = similar vectors
2. **Our model: 384 dimensions** - all-MiniLM-L6-v2 via Transformers.js
3. **Cosine similarity** - Measures how alike two embeddings are (use 0.1-0.3 threshold for local model)
4. **Consistency is key** - Same model for indexing and search
5. **Chunk large documents** - Stay within token limits
6. **Local = Free** - No API costs, no rate limits, works offline

## In Our Project

The embedding service is in [src/lib/embeddings/local.ts](../src/lib/embeddings/local.ts):

```typescript
// Generate embedding for a query
import { generateEmbedding } from '@/lib/embeddings/local';

const queryEmbedding = await generateEmbedding("What is RAG?");
// Returns: Array of 384 numbers

// The vector-store uses this internally for search
import { searchDocuments } from '@/lib/rag/vector-store';
const results = await searchDocuments("What is RAG?", 0.1, 5);
```

**Note**: Embeddings are cached using an LRU cache with 24-hour TTL for performance.

---

[← Previous: What is RAG?](01-what-is-rag.md) | [Next: Vector Databases →](03-vector-databases.md)
