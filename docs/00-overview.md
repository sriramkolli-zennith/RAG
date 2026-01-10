# 🏠 RAG Chatbase Agent - Overview

## Introduction

**RAG Chatbase Agent** is a production-ready, enterprise-grade Retrieval-Augmented Generation (RAG) application built with Next.js 14+, Supabase, and Azure OpenAI. It enables you to build an intelligent chatbot that answers questions based on your own knowledge base.

## Key Features

### 🔍 Intelligent Search
- **Semantic Search**: Find documents by meaning, not just keywords
- **Vector Embeddings**: Uses local Transformers.js (all-MiniLM-L6-v2) - free, fast, offline-capable
- **Configurable Similarity**: Adjustable thresholds for precision vs recall

### 💬 Advanced Chat
- **Conversation History**: Multi-turn conversations with context awareness
- **Streaming Responses**: Real-time token-by-token response streaming
- **Source Citations**: Every answer links back to source documents

### 📄 Document Management
- **Multi-format Support**: TXT, MD, PDF (with text extraction)
- **Smart Chunking**: Automatic document splitting with overlap
- **Batch Upload**: Process multiple documents at once

### 🔐 Enterprise Ready
- **Authentication**: NextAuth.js integration support
- **Analytics**: Built-in usage tracking and metrics
- **Logging**: Comprehensive logging for debugging and monitoring

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        RAG CHATBASE AGENT                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐   │
│  │   Next.js   │     │   Supabase  │     │    Azure OpenAI         │   │
│  │   Frontend  │◄───►│   (pgvector)│◄───►│    (Chat Completions)   │   │
│  │             │     │             │     │                         │   │
│  └─────────────┘     └─────────────┘     └─────────────────────────┘   │
│         │                   │                       │                   │
│         │                   │                       │                   │
│         ▼                   ▼                       ▼                   │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────┐   │
│  │    React    │     │   Vector    │     │    Local Embeddings     │   │
│  │  Components │     │    Store    │     │  (Transformers.js)      │   │
│  │             │     │             │     │   all-MiniLM-L6-v2      │   │
│  └─────────────┘     └─────────────┘     └─────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14+, React, TailwindCSS | UI and server components |
| **Backend** | Next.js API Routes | RESTful API endpoints |
| **Database** | Supabase (PostgreSQL + pgvector) | Vector storage and search |
| **Embeddings** | Transformers.js (local) | 384-dimensional vectors |
| **LLM** | Azure OpenAI (GPT-4o-mini) | Chat completions |
| **Auth** | NextAuth.js | Authentication (optional) |
| **Validation** | Zod | Input validation |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── chat/          # Chat endpoints (regular + streaming)
│   │   ├── documents/     # Document CRUD + upload
│   │   ├── search/        # Semantic search
│   │   ├── conversations/ # Conversation management
│   │   └── analytics/     # Usage tracking
│   ├── admin/             # Admin dashboard
│   └── page.tsx           # Main chat interface
│
├── components/            # React Components
│   ├── ChatInterface.tsx  # Main chat UI
│   ├── ChatInput.tsx      # Message input
│   ├── ChatMessage.tsx    # Message display
│   ├── ConversationList.tsx # Sidebar conversations
│   └── DocumentUpload.tsx # File upload modal
│
├── lib/                   # Core Libraries
│   ├── rag/              # RAG Engine
│   │   ├── engine.ts     # Main RAG logic
│   │   ├── vector-store.ts # Vector operations
│   │   └── chunking.ts   # Text splitting
│   ├── embeddings/       # Embedding generation
│   │   └── local.ts      # Local Transformers.js
│   ├── openai/           # Azure OpenAI client
│   │   └── client.ts     # Chat completions
│   ├── supabase/         # Database client
│   └── cache.ts          # LRU caching
│
└── types/                 # TypeScript definitions
```

## Quick Start

### 1. Prerequisites
- Node.js 18+
- Supabase account
- Azure OpenAI access (for chat completions)

### 2. Environment Setup
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-key
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_CHAT_DEPLOYMENT=gpt-4o-mini
```

### 3. Database Setup
Run the migrations in order:
1. `supabase/schema.sql` - Base tables
2. `supabase/migrations/001_create_conversations.sql` - Conversations
3. `supabase/migrations/003_switch_to_local_embeddings.sql` - Local embeddings

### 4. Start Development
```bash
npm install
npm run dev
```

## Documentation Guide

| Document | Description |
|----------|-------------|
| [00-overview.md](00-overview.md) | This document - project overview |
| [01-what-is-rag.md](01-what-is-rag.md) | RAG concepts and fundamentals |
| [02-embeddings.md](02-embeddings.md) | Understanding vector embeddings |
| [03-vector-databases.md](03-vector-databases.md) | Vector search with Supabase |
| [04-rag-pipeline.md](04-rag-pipeline.md) | Complete pipeline walkthrough |
| [05-api-reference.md](05-api-reference.md) | API endpoint documentation |
| [06-architecture.md](06-architecture.md) | System architecture details |
| [07-components.md](07-components.md) | Frontend component guide |
| [08-database-setup.md](08-database-setup.md) | Database migrations & setup |
| [09-configuration.md](09-configuration.md) | Environment & configuration |
| [local-embeddings.md](local-embeddings.md) | Local embedding setup |

## Key Concepts

### The RAG Flow
```
User Question → Embed Query → Search Vectors → Retrieve Docs → Augment Prompt → Generate Answer
```

### Embedding Dimensions
- **Local Model**: 384 dimensions (all-MiniLM-L6-v2)
- **Similarity Threshold**: 0.1 - 0.3 recommended for local model

### Chunking Strategy
- **Default Size**: 1500 characters
- **Overlap**: 300 characters
- **Strategy**: Paragraph-aware splitting

---

[Next: What is RAG? →](01-what-is-rag.md)
