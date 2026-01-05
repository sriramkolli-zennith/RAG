# 📡 API Reference

This document describes all the API endpoints available in the RAG Chatbase Agent.

## Base URL

```
http://localhost:3000/api
```

---

## Chat Endpoints

### POST /api/chat

Send a message and receive a RAG-powered response.

#### Request

```typescript
{
  "message": string,      // Required: The user's question
  "sessionId": string,    // Required: Unique session identifier
  "options": {            // Optional: Configuration
    "matchThreshold": number,  // Min similarity (0-1), default: 0.7
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
        "content": string,   // Truncated preview
        "metadata": object,
        "similarity": number // 0-1 score
      }
    ],
    "sessionId": string
  }
}
```

#### Example

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is RAG?",
    "sessionId": "session_123"
  }'
```

#### Response Example

```json
{
  "success": true,
  "data": {
    "answer": "RAG (Retrieval-Augmented Generation) is an AI framework that combines information retrieval with text generation...",
    "sources": [
      {
        "id": "doc_abc123",
        "content": "RAG Overview: RAG (Retrieval-Augmented Generation) is an AI framework...",
        "metadata": { "source": "RAG Documentation" },
        "similarity": 0.94
      }
    ],
    "sessionId": "session_123"
  }
}
```

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

#### Example

```bash
curl http://localhost:3000/api/documents
```

---

### POST /api/documents

Add a new document to the knowledge base.

#### Request

```typescript
{
  "content": string,     // Required: Document content
  "metadata": object,    // Optional: Additional metadata
  "chunk": boolean,      // Optional: Auto-chunk, default: true
  "chunkOptions": {      // Optional: Chunking configuration
    "chunkSize": number,   // Characters per chunk, default: 1000
    "chunkOverlap": number // Overlap between chunks, default: 200
  }
}
```

#### Response

```typescript
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
