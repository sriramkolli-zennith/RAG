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
| text-embedding-ada-002 | 1536 | OpenAI | General purpose |
| text-embedding-3-small | 1536 | OpenAI | Cost-effective |
| text-embedding-3-large | 3072 | OpenAI | Highest quality |
| all-MiniLM-L6-v2 | 384 | Open Source | Fast, local |
| Cohere embed-v3 | 1024 | Cohere | Multilingual |

## Working with Embeddings in Code

### Generating an Embedding

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  });
  
  return response.data[0].embedding; // Array of 1536 numbers
}

// Usage
const embedding = await generateEmbedding("What is machine learning?");
console.log(`Vector dimensions: ${embedding.length}`); // 1536
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

## Why 1536 Dimensions?

More dimensions = more nuance captured.

Think of it like describing a person:

| Dimensions | Description |
|------------|-------------|
| 2 | Tall, Short |
| 5 | Tall, Short, Old, Young, Friendly |
| 100 | Height, Age, Personality traits, Hobbies, ... |
| 1536 | Every nuance of meaning! |

## Practical Considerations

### Token Limits
Embedding models have maximum input sizes:
- ada-002: 8,191 tokens (~6,000 words)
- For longer texts, you must chunk first

### Batch Processing
Process multiple texts efficiently:

```typescript
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: texts, // Array of texts
  });
  
  return response.data.map(d => d.embedding);
}

// Process multiple at once
const embeddings = await generateEmbeddings([
  "First document",
  "Second document",
  "Third document"
]);
```

### Cost Considerations
| Model | Price per 1M tokens |
|-------|---------------------|
| text-embedding-ada-002 | $0.10 |
| text-embedding-3-small | $0.02 |
| text-embedding-3-large | $0.13 |

Average document (500 words ≈ 700 tokens):
- ~1,400 documents per $0.10 with ada-002
- ~7,000 documents per $0.10 with 3-small

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
2. **Fixed dimensions** - Every embedding has the same size (e.g., 1536)
3. **Cosine similarity** - Measures how alike two embeddings are
4. **Consistency is key** - Use the same model for indexing and search
5. **Chunk large documents** - Stay within token limits

## In Our Project

The embedding service is in [src/lib/openai/embeddings.ts](../src/lib/openai/embeddings.ts):

```typescript
// Generate embedding for a query
const queryEmbedding = await generateEmbedding("What is RAG?");

// Compare embeddings for similarity
const similarity = cosineSimilarity(queryEmbedding, documentEmbedding);
```

---

[← Previous: What is RAG?](01-what-is-rag.md) | [Next: Vector Databases →](03-vector-databases.md)
