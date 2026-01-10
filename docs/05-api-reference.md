# 📡 API Reference

This document describes all the API endpoints available in the RAG Chatbase Agent.

## Base URL

```
http://localhost:3000/api
```

---

## Chat Endpoints

### POST /api/chat

Send a message and receive a RAG-powered response with conversation support.

#### Request

```typescript
{
  "message": string,         // Required: The user's question
  "sessionId": string,       // Required: Unique session identifier
  "conversationId": string,  // Optional: Conversation ID for history
  "options": {               // Optional: Configuration
    "matchThreshold": number,  // Min similarity (0-1), default: 0.1
    "matchCount": number,      // Max results, default: 5
    "includeHistory": boolean  // Include chat history, default: true
  }
}
```

#### Response

```typescript
{
  "success": true,
  "data": {
    "answer": string,        // The generated answer
    "sources": [             // Retrieved documents
      {
        "id": string,
        "content": string,   // Truncated to 200 chars + "..."
        "metadata": object,
        "similarity": number // 0-1 score
      }
    ],
    "sessionId": string,
    "conversationId": string
  }
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is RAG?",
    "sessionId": "session_123",
    "options": {
      "matchThreshold": 0.1,
      "matchCount": 5
    }
  }'
```

#### Notes
- Uses local embeddings (384 dimensions) - recommended threshold is 0.1-0.3
- Messages are automatically saved to conversation history
- Conversation timestamp is updated after each message

---

### POST /api/chat/stream

Stream a chat response in real-time using Server-Sent Events.

#### Request

Same as `/api/chat`

#### Response

Server-Sent Events stream:

```
data: {"type":"sources","data":[...]}

data: {"type":"token","data":"RAG"}

data: {"type":"token","data":" stands"}

data: {"type":"token","data":" for"}

data: [DONE]
```

#### Example (JavaScript)

```typescript
const response = await fetch('/api/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "What is RAG?",
    sessionId: "session_123"
  }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value);
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;
      
      const parsed = JSON.parse(data);
      if (parsed.type === 'token') {
        process.stdout.write(parsed.data);
      }
    }
  }
}
```

---

## Document Endpoints

### GET /api/documents

Retrieve all documents from the knowledge base.

#### Response

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "content": string,
      "metadata": object,
      "created_at": string,
      "updated_at": string
    }
  ],
  "count": number
}
```

---

### POST /api/documents

Add a new document or batch of documents to the knowledge base.

#### Single Document Request

```typescript
{
  "content": string,     // Required: Document content (min 10 chars)
  "metadata": object,    // Optional: Additional metadata
  "chunk": boolean,      // Optional: Auto-chunk, default: true
  "chunkOptions": {      // Optional: Chunking configuration
    "chunkSize": number,   // Characters per chunk, default: 1500
    "chunkOverlap": number // Overlap between chunks, default: 300
  }
}
```

#### Batch Upload Request

```typescript
{
  "documents": [         // Required: Array of documents (max 100)
    {
      "content": string, // Required: Document content
      "source": string   // Optional: Source identifier
    }
  ]
}
```

#### Response

```typescript
{
  "success": true,
  "data": {
    "message": string,
    "count": number,
    "documentIds": string[]
  }
}
```

---

### POST /api/documents/upload

Upload files (including PDFs) with automatic text extraction and chunking.

#### Request

`multipart/form-data` with:
- `files`: One or more files (TXT, MD, DOC, DOCX, PDF)

#### Response

```typescript
{
  "success": true,
  "data": {
    "message": string,
    "count": number,
    "documentIds": string[]
  }
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "files=@document1.pdf" \
  -F "files=@document2.txt"
```

#### Notes
- PDF text is extracted using pdf2json
- For scanned PDFs, OCR is recommended (see Google Vision integration)
- Documents are automatically chunked with default settings

---

### DELETE /api/documents

Delete a document from the knowledge base.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Document ID to delete |

#### Response

```typescript
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## Search Endpoint

### POST /api/search

Perform semantic search on the knowledge base.

#### Request

```typescript
{
  "query": string,          // Required: Search query (max 1000 chars)
  "matchThreshold": number, // Optional: Min similarity (0-1), default: 0.1
  "matchCount": number      // Optional: Max results (1-20), default: 10
}
```

#### Response

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "content": string,
      "metadata": object,
      "similarity": number
    }
  ],
  "count": number
}
```

#### Notes
- Uses local embeddings with 384 dimensions
- Recommended threshold: 0.1 - 0.3 (local models produce lower scores than OpenAI)
- Results are sorted by similarity (highest first)

---

## Conversation Endpoints

### GET /api/conversations

Get all conversations for a session or user.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | No | Filter by session |
| `userId` | string | No | Filter by user |

#### Response

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "session_id": string,
      "user_id": string | null,
      "title": string,
      "created_at": string,
      "updated_at": string,
      "archived": boolean
    }
  ],
  "count": number
}
```

---

### POST /api/conversations

Create a new conversation.

#### Request

```typescript
{
  "sessionId": string,  // Required: Session identifier
  "title": string,      // Optional: Conversation title
  "userId": string      // Optional: User identifier
}
```

#### Response

```typescript
{
  "success": true,
  "data": {
    "id": string,
    "session_id": string,
    "title": string,
    "created_at": string
  }
}
```

---

### GET /api/conversations/[conversationId]/messages

Get all messages for a conversation.

#### Response

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "role": "user" | "assistant",
      "content": string,
      "sources": object[],
      "created_at": string
    }
  ]
}
```

---

### POST /api/conversations/[conversationId]/export

Export conversation in various formats.

---

## Analytics Endpoint

### GET /api/analytics

Get usage analytics for the specified time period.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `days` | number | No | Number of days (default: 7) |

#### Response

```typescript
{
  "success": true,
  "data": {
    "period": string,
    "conversations": {
      "total": number,
      "perDay": number
    },
    "messages": {
      "total": number,
      "perConversation": number
    }
  }
}
```

---

### POST /api/analytics

Track an analytics event.

#### Request

```typescript
{
  "event": string,       // Event name (e.g., "message_sent")
  "properties": object   // Event properties
}
```

---

## Debug Endpoints

These endpoints are available for debugging and development:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/debug/db-status` | GET | Check database connection |
| `/api/debug/check-embeddings` | GET | Verify embedding dimensions |
| `/api/debug/documents` | GET | List documents with metadata |
| `/api/debug/test-search` | POST | Test semantic search |
| `/api/debug/function-test` | GET | Test match_documents function |
| `/api/debug/raw-query` | POST | Execute raw SQL query |

---

## Health Endpoint

### GET /api/health

Check API health status.

#### Response

```typescript
{
  "status": "ok",
  "timestamp": string
}
```

---

## Error Responses

All endpoints return errors in this format:

```typescript
{
  "error": string,             // Error message
  "message": string,           // Detailed message (dev mode only)
  "details": string[]          // Validation errors (if applicable)
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid input or validation failed |
| 500 | Internal Server Error - Something went wrong |

---

## Input Validation

All endpoints use Zod for validation. Key constraints:

| Field | Constraints |
|-------|-------------|
| `message` | 1-5000 characters |
| `sessionId` | Non-empty string |
| `content` (document) | Min 10 characters |
| `query` (search) | 1-1000 characters |
| `documents` (batch) | 1-100 items |

---

## TypeScript Types

### Message Types

```typescript
interface ChatRequest {
  message: string;
  sessionId: string;
  conversationId?: string;
  options?: {
    matchThreshold?: number;  // default: 0.1
    matchCount?: number;      // default: 5
    includeHistory?: boolean; // default: true
  };
}

interface ChatResponse {
  success: boolean;
  data: {
    answer: string;
    sources: Source[];
    sessionId: string;
    conversationId?: string;
  };
}

interface Source {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}
```

### Document Types

```typescript
interface Document {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];  // 384 dimensions
  created_at: string;
  updated_at: string;
}

interface DocumentCreate {
  content: string;
  metadata?: Record<string, unknown>;
  chunk?: boolean;
  chunkOptions?: {
    chunkSize?: number;    // default: 1500
    chunkOverlap?: number; // default: 300
  };
}
```

---

## Rate Limits

Using local embeddings eliminates API rate limits for embeddings. Only chat completions have Azure OpenAI limits:

| Operation | Limit |
|-----------|-------|
| Chat requests | Based on Azure OpenAI tier |
| Document additions | Unlimited (local embeddings) |
| Search requests | Unlimited (local embeddings) |

---

[← Previous: RAG Pipeline](04-rag-pipeline.md) | [Next: Architecture →](06-architecture.md)
{
  "success": true,
  "data": Document | Document[],  // Created document(s)
  "message": string
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "content": "This is my document content about machine learning...",
    "metadata": { "source": "ML Guide", "category": "technical" },
    "chunk": true
  }'
```

---

### DELETE /api/documents

Delete a document from the knowledge base.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | Yes | Document ID to delete |

#### Response

```typescript
{
  "success": true,
  "message": "Document deleted successfully"
}
```

#### Example

```bash
curl -X DELETE "http://localhost:3000/api/documents?id=doc_abc123"
```

---

## Search Endpoint

### POST /api/search

Perform semantic search on the knowledge base.

#### Request

```typescript
{
  "query": string,          // Required: Search query
  "matchThreshold": number, // Optional: Min similarity (0-1), default: 0.7
  "matchCount": number      // Optional: Max results, default: 10
}
```

#### Response

```typescript
{
  "success": true,
  "data": [
    {
      "id": string,
      "content": string,
      "metadata": object,
      "similarity": number
    }
  ],
  "count": number
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "vector database similarity search",
    "matchThreshold": 0.7,
    "matchCount": 5
  }'
```

---

## Error Responses

All endpoints return errors in this format:

```typescript
{
  "error": string  // Error message
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request - Missing or invalid parameters |
| 500 | Internal Server Error - Something went wrong |

---

## TypeScript Types

### Message Types

```typescript
interface ChatRequest {
  message: string;
  sessionId: string;
  options?: {
    matchThreshold?: number;
    matchCount?: number;
    includeHistory?: boolean;
  };
}

interface ChatResponse {
  success: boolean;
  data: {
    answer: string;
    sources: Source[];
    sessionId: string;
  };
}

interface Source {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}
```

### Document Types

```typescript
interface Document {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  embedding?: number[];
  created_at: string;
  updated_at: string;
}

interface DocumentCreate {
  content: string;
  metadata?: Record<string, unknown>;
  chunk?: boolean;
  chunkOptions?: {
    chunkSize?: number;
    chunkOverlap?: number;
  };
}
```

---

## Rate Limits

These are soft limits based on OpenAI API usage:

| Operation | Limit |
|-----------|-------|
| Chat requests | ~60/minute |
| Document additions | ~20/minute |
| Search requests | ~60/minute |

---

## SDK Usage

### JavaScript/TypeScript Client

```typescript
class RAGClient {
  private baseUrl: string;
  private sessionId: string;
  
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.sessionId = `session_${Date.now()}`;
  }
  
  async chat(message: string): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId: this.sessionId }),
    });
    return response.json();
  }
  
  async search(query: string, options = {}): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, ...options }),
    });
    return response.json();
  }
  
  async addDocument(content: string, metadata = {}): Promise<DocumentResponse> {
    const response = await fetch(`${this.baseUrl}/api/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, metadata }),
    });
    return response.json();
  }
}

// Usage
const client = new RAGClient('http://localhost:3000');
const response = await client.chat('What is RAG?');
console.log(response.data.answer);
```

---

[← Previous: RAG Pipeline](04-rag-pipeline.md)
