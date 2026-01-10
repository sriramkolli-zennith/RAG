# ⚙️ Configuration & Environment

This document covers all configuration options for the RAG Chatbase Agent.

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# ==========================================
# REQUIRED - Supabase Configuration
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ==========================================
# REQUIRED - Azure OpenAI (Chat Only)
# ==========================================
# Note: Embeddings are now LOCAL - no API needed!
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_API_VERSION=2024-02-01

# ==========================================
# OPTIONAL - Model Configuration
# ==========================================
MAX_TOKENS=1000              # Max tokens in response (default: 1000)
TEMPERATURE=0.7              # Response creativity 0-1 (default: 0.7)

# ==========================================
# OPTIONAL - Logging
# ==========================================
LOG_LEVEL=debug              # debug | info | warn | error
NODE_ENV=development         # development | production

# ==========================================
# OPTIONAL - Authentication (NextAuth)
# ==========================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth Providers (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

# ==========================================
# REMOVED - No longer needed!
# ==========================================
# AZURE_OPENAI_EMBEDDING_DEPLOYMENT  <- Now using local embeddings
```

## Configuration Files

### `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@xenova/transformers'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      'onnxruntime-node$': false,
    };
    return config;
  },
};

module.exports = nextConfig;
```

### `tsconfig.json`

Key settings for our project:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### `tailwind.config.js`

TailwindCSS configuration:

```javascript
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

## RAG Configuration

### Default Settings

| Setting | Default | Location |
|---------|---------|----------|
| Chunk Size | 1500 chars | `src/lib/rag/chunking.ts` |
| Chunk Overlap | 300 chars | `src/lib/rag/chunking.ts` |
| Match Threshold | 0.1 | `src/lib/rag/engine.ts` |
| Match Count | 5 | `src/lib/rag/engine.ts` |
| Max Tokens | 1000 | `src/lib/openai/client.ts` |
| Temperature | 0.7 | `src/lib/openai/client.ts` |

### Adjusting Chunking

```typescript
// src/lib/rag/chunking.ts
const DEFAULT_OPTIONS: ChunkOptions = {
  chunkSize: 1500,    // Increase for more context per chunk
  chunkOverlap: 300,  // Increase for better continuity
};
```

**Guidelines:**
- Larger chunks (2000+): Better context, but less precise retrieval
- Smaller chunks (500-1000): More precise, but may lose context
- More overlap: Better continuity, but more storage

### Adjusting Search

```typescript
// In API calls or engine.ts
const options = {
  matchThreshold: 0.1,  // Lower = more results (use 0.1-0.3 for local embeddings)
  matchCount: 5,        // Number of documents to retrieve
  includeHistory: true, // Include conversation history
};
```

### Adjusting Generation

```typescript
// src/lib/openai/client.ts
export const MAX_TOKENS = parseInt(process.env.MAX_TOKENS || '1000');
export const TEMPERATURE = parseFloat(process.env.TEMPERATURE || '0.7');
```

| Temperature | Effect |
|-------------|--------|
| 0.0-0.3 | Very focused, deterministic |
| 0.4-0.7 | Balanced (recommended) |
| 0.8-1.0 | Creative, more varied |

## Cache Configuration

### Embedding Cache

```typescript
// src/lib/cache.ts
class LRUCache<T> {
  private maxSize: number = 1000;  // Max entries
}

// Usage in embeddings
embeddingCache.set(cacheKey, embedding, 86400); // 24 hour TTL
```

**To modify:**
- Change `maxSize` for more/fewer cached embeddings
- Change TTL (86400 seconds = 24 hours)

## Logging Configuration

```typescript
// src/lib/logger.ts
const isDevelopment = process.env.NODE_ENV === 'development';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');
```

**Log Levels:**
- `debug`: All logs (development)
- `info`: Info, warnings, errors
- `warn`: Warnings and errors only
- `error`: Errors only

## Database Configuration

### Supabase Client

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

### Vector Index Tuning

For optimal vector search performance:

```sql
-- For up to 1 million documents
CREATE INDEX documents_embedding_idx 
ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- For larger datasets (1M+), increase lists
WITH (lists = 1000);

-- For smaller datasets or higher accuracy, use HNSW
CREATE INDEX documents_embedding_idx 
ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

## Scripts Configuration

### Available Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "seed": "tsx scripts/seed-knowledge-base.ts",
    "reprocess": "tsx scripts/reprocess-documents.ts",
    "test:rag": "tsx scripts/test-rag-pipeline.ts"
  }
}
```

### Running Scripts

```bash
# Development server
npm run dev

# Seed knowledge base
npm run seed

# Reprocess all documents (re-embed)
npm run reprocess

# Test RAG pipeline
npm run test:rag
```

## Memory Optimization

For large document sets or memory-constrained environments:

```bash
# Increase Node.js memory
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

## Production Checklist

1. **Environment Variables**
   - [ ] All required vars set
   - [ ] Using production Supabase instance
   - [ ] `NODE_ENV=production`

2. **Database**
   - [ ] All migrations run
   - [ ] RLS policies enabled
   - [ ] Indexes created

3. **Security**
   - [ ] Service role key secured
   - [ ] NEXTAUTH_SECRET set (if using auth)
   - [ ] CORS configured

4. **Performance**
   - [ ] Appropriate chunk size
   - [ ] Vector indexes created
   - [ ] Cache configured

---

[← Previous: Database Setup](08-database-setup.md) | [Back to Overview →](00-overview.md)
