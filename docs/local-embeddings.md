# Local Embeddings with Transformers.js

This project uses **local embeddings** instead of OpenAI/Azure, making it cost-free and offline-capable!

## What Changed?

### Before (Azure OpenAI)
- ❌ Required Azure OpenAI API key
- ❌ Cost per embedding generated (~$0.10/1M tokens)
- ❌ Rate limits (1000 TPM)
- ❌ Required internet connection
- ✅ 1536-dimensional embeddings

### After (Transformers.js)
- ✅ **No API key needed** for embeddings
- ✅ **No costs** - completely free
- ✅ **No rate limits**
- ✅ **Works offline** (after model download)
- ✅ 384-dimensional embeddings (all-MiniLM-L6-v2)
- ✅ **Caching** - embeddings are cached for 24 hours

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    EMBEDDING FLOW                                │
│                                                                 │
│  ┌──────────┐     ┌──────────────┐     ┌──────────────────┐   │
│  │   Text   │────▶│  LRU Cache   │────▶│ Return Cached    │   │
│  │  Input   │     │  (MD5 key)   │     │ (if exists)      │   │
│  └──────────┘     └──────┬───────┘     └──────────────────┘   │
│                          │ miss                                │
│                          ▼                                     │
│                   ┌──────────────┐                             │
│                   │Transformers.js│                            │
│                   │all-MiniLM-L6 │                             │
│                   │(384 dims)    │                             │
│                   └──────┬───────┘                             │
│                          │                                     │
│                          ▼                                     │
│                   ┌──────────────┐                             │
│                   │ Cache Result │                             │
│                   │ (24h TTL)    │                             │
│                   └──────────────┘                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Migration Guide

### Step 1: Run Database Migration

In your Supabase SQL Editor, run:

```sql
-- Copy and paste the contents of:
-- supabase/migrations/003_switch_to_local_embeddings.sql
```

This updates the database to support 384-dimensional embeddings.

### Step 2: Delete Old Documents

Old embeddings (1536D) are incompatible with the new model (384D).

**Option A: Using Supabase Dashboard**
```sql
DELETE FROM documents;
```

**Option B: Using Admin Panel**
1. Go to http://localhost:3000/admin
2. Delete documents one by one

### Step 3: Re-upload Documents

Upload your documents again via the admin panel. They'll automatically be embedded using the local model.

## How It Works

The new embedding system uses:

- **Model**: `Xenova/all-MiniLM-L6-v2`
- **Library**: `@xenova/transformers`
- **Dimensions**: 384 (vs 1536 previously)
- **Quality**: ~90-95% of OpenAI's ada-002 quality
- **Speed**: First load ~10s (model download), then ~50-100ms per embedding

### Technical Implementation

```typescript
// src/lib/embeddings/local.ts
import { pipeline, env } from '@xenova/transformers';
import { embeddingCache } from '../cache';
import crypto from 'crypto';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = false;

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
let embeddingPipeline: any = null;

// Lazy load the model
async function getEmbeddingPipeline() {
  if (!embeddingPipeline) {
    console.log('[Embeddings] Loading local embedding model...');
    embeddingPipeline = await pipeline('feature-extraction', MODEL_NAME);
    console.log('[Embeddings] Model loaded successfully');
  }
  return embeddingPipeline;
}

// Generate embedding with caching
export async function generateEmbedding(text: string): Promise<number[]> {
  const cleanedText = text.replace(/\n/g, ' ').trim();
  
  // Check cache
  const cacheKey = crypto.createHash('md5').update(cleanedText).digest('hex');
  const cached = embeddingCache.get(cacheKey);
  if (cached) return cached;
  
  // Generate embedding
  const extractor = await getEmbeddingPipeline();
  const output = await extractor(cleanedText, { 
    pooling: 'mean',      // Average all token embeddings
    normalize: true        // L2 normalize for cosine similarity
  });
  
  const embedding = Array.from(output.data) as number[];
  
  // Cache for 24 hours
  embeddingCache.set(cacheKey, embedding, 86400);
  
  return embedding;
}
```

### Code Location

- **Embedding Service**: [src/lib/embeddings/local.ts](../src/lib/embeddings/local.ts)
- **Vector Store** (uses embeddings): [src/lib/rag/vector-store.ts](../src/lib/rag/vector-store.ts)
- **Cache Implementation**: [src/lib/cache.ts](../src/lib/cache.ts)
- **Migration SQL**: [supabase/migrations/003_switch_to_local_embeddings.sql](../supabase/migrations/003_switch_to_local_embeddings.sql)

## Performance

### Model Loading
- **First time**: ~10 seconds (downloads ~90MB model)
- **Subsequent**: Instant (model cached in memory)

### Embedding Generation
- **Single text**: ~50-100ms
- **Batch (10 texts)**: ~500ms
- **Cached lookup**: <1ms

### Quality Comparison
| Metric | all-MiniLM-L6-v2 | OpenAI ada-002 |
|--------|------------------|----------------|
| Dimensions | 384 | 1536 |
| Model Size | ~90MB | N/A (API) |
| Semantic Quality | ~90-95% | 100% (baseline) |
| Speed (local) | ~50ms | ~200ms |
| Cost | $0 | $0.10/1M tokens |

### Similarity Score Differences

**Important**: Local models produce **lower similarity scores** than OpenAI:

| Match Type | OpenAI Score | Local Score |
|------------|--------------|-------------|
| Exact/Very Similar | 0.90-0.99 | 0.40-0.60 |
| Related | 0.70-0.85 | 0.20-0.40 |
| Somewhat Related | 0.50-0.70 | 0.10-0.20 |
| Unrelated | <0.50 | <0.10 |

**Recommendation**: Use threshold of **0.1** for local embeddings (we default to this).

## Environment Variables

You can now **remove** these from your `.env`:

```bash
# No longer needed!
# AZURE_OPENAI_API_KEY=...
# AZURE_OPENAI_ENDPOINT=...
# AZURE_OPENAI_EMBEDDING_DEPLOYMENT=...
```

Keep these (still needed for chat):
```bash
AZURE_OPENAI_API_KEY=...              # For chat completions
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_CHAT_DEPLOYMENT=...
```

## Alternative: Keep Using OpenAI

If you prefer to keep using Azure OpenAI embeddings, simply revert the change:

```typescript
// In src/lib/rag/vector-store.ts
import { generateEmbedding } from '../openai/embeddings';  // Use OpenAI
// import { generateEmbedding } from '../embeddings/local';  // Use local
```

And keep your database at 1536 dimensions.

## Troubleshooting

### Model Download Issues

If the model fails to download:

```bash
# Clear transformers cache
rm -rf ~/.cache/huggingface
```

### Memory Issues

If Node.js runs out of memory:

```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

### Dimension Mismatch Error

If you see "dimension mismatch" errors:
1. Make sure you ran the SQL migration
2. Delete all old documents
3. Restart the dev server

## Benefits Summary

1. **Cost Savings**: $0 instead of ~$0.10 per 1M tokens
2. **No Rate Limits**: Generate embeddings as fast as your CPU allows
3. **Privacy**: Documents never leave your server
4. **Offline**: Works without internet (after first model download)
5. **Simple**: One less API key to manage
6. **Caching**: Automatic 24-hour cache reduces redundant computation

## Caching Details

Embeddings are cached using an LRU (Least Recently Used) cache:

```typescript
// src/lib/cache.ts
class LRUCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private maxSize: number = 1000;  // Max 1000 entries
  
  set(key: string, value: T, ttlSeconds: number = 300)
  get(key: string): T | null
}

// In embeddings:
const cacheKey = crypto.createHash('md5').update(text).digest('hex');
embeddingCache.set(cacheKey, embedding, 86400);  // 24 hour TTL
```

**Benefits**:
- Same text → same embedding (deterministic)
- Reduces repeat computations
- Memory-efficient with automatic eviction

## Learn More

- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [all-MiniLM-L6-v2 Model Card](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- [Understanding Embeddings](02-embeddings.md)
- [Database Setup](08-database-setup.md)

---

[← Previous: Components](07-components.md) | [Back to Overview →](00-overview.md)
