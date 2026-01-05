# 📚 What is RAG (Retrieval-Augmented Generation)?

## Introduction

**RAG** stands for **Retrieval-Augmented Generation**. It's a powerful AI technique that enhances Large Language Models (LLMs) by giving them access to external knowledge sources.

## The Problem RAG Solves

LLMs like GPT-4 have impressive capabilities, but they have significant limitations:

### 1. Knowledge Cutoff
LLMs are trained on data up to a certain date. They don't know about events or information after their training cutoff.

```
❌ User: "What were Apple's Q4 2025 earnings?"
❌ LLM: "I don't have information about 2025..."
```

### 2. Hallucinations
LLMs can confidently make up information that sounds plausible but is incorrect.

```
❌ User: "What is the company's refund policy?"
❌ LLM: *makes up a policy that doesn't exist*
```

### 3. No Access to Private Data
LLMs don't have access to your company's internal documents, databases, or proprietary information.

## How RAG Works

RAG solves these problems by adding a **retrieval step** before generation:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          RAG PIPELINE                                    │
│                                                                         │
│   ┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────┐│
│   │          │     │              │     │              │     │        ││
│   │  Query   │────▶│   RETRIEVE   │────▶│   AUGMENT    │────▶│GENERATE││
│   │          │     │              │     │              │     │        ││
│   └──────────┘     └──────────────┘     └──────────────┘     └────────┘│
│       │                  │                    │                  │     │
│       │                  │                    │                  │     │
│       ▼                  ▼                    ▼                  ▼     │
│  "What is the      Search vector        Add retrieved        LLM     │
│   refund policy?"  database for        context to          generates │
│                    relevant docs        the prompt          answer    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### Step 1: RETRIEVE
Find relevant documents from your knowledge base using semantic search.

### Step 2: AUGMENT
Add the retrieved documents to the prompt as context.

### Step 3: GENERATE
Let the LLM generate an answer based on the provided context.

## RAG in Action: A Real Example

Let's trace through a complete example:

### User's Question
```
"What is your company's refund policy?"
```

### Step 1: Retrieve
The system converts the question to an embedding and searches the vector database:

```javascript
// User's question is converted to a vector
const queryEmbedding = await generateEmbedding("What is your company's refund policy?");

// Search finds relevant documents
const relevantDocs = await searchDocuments(queryEmbedding);
// Returns: [
//   { content: "Refund Policy: Full refunds within 30 days...", similarity: 0.92 },
//   { content: "Returns must be in original packaging...", similarity: 0.85 }
// ]
```

### Step 2: Augment
The system constructs a prompt with the retrieved context:

```
System: You are a helpful assistant. Answer based only on the provided context.

Context:
---
[Document 1] Refund Policy: Full refunds within 30 days of purchase...
[Document 2] Returns must be in original packaging...
---

User: What is your company's refund policy?
```

### Step 3: Generate
The LLM generates an accurate, grounded response:

```
Assistant: Based on our policy, you can receive a full refund within 30 days 
of purchase. Please ensure items are returned in their original packaging.
```

## Benefits of RAG

| Benefit | Description |
|---------|-------------|
| **Accuracy** | Answers are grounded in actual documents |
| **Up-to-date** | Knowledge base can be updated anytime |
| **Transparency** | You can show which sources were used |
| **No Fine-tuning** | Add knowledge without retraining the model |
| **Cost-effective** | Cheaper than fine-tuning for most use cases |

## RAG vs Fine-Tuning

| Aspect | RAG | Fine-Tuning |
|--------|-----|-------------|
| **When to update knowledge** | Add new documents anytime | Retrain the model |
| **Cost** | Lower (API calls + database) | Higher (GPU compute) |
| **Use case** | Factual Q&A, search | Style, format, behavior |
| **Transparency** | Can cite sources | Black box |
| **Setup complexity** | Moderate | Complex |

## When to Use RAG

✅ **Good use cases:**
- Customer support bots with knowledge bases
- Documentation assistants
- Internal company Q&A
- Research assistants
- Legal document analysis

❌ **Not ideal for:**
- Creative writing (no factual grounding needed)
- General conversation (no specific knowledge needed)
- Code generation (better with specialized models)

## The RAG Stack

A complete RAG system needs these components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        RAG STACK                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  EMBEDDING      │  │  VECTOR         │  │  LLM            │ │
│  │  MODEL          │  │  DATABASE       │  │                 │ │
│  │                 │  │                 │  │                 │ │
│  │  • OpenAI Ada   │  │  • Supabase     │  │  • GPT-4        │ │
│  │  • Cohere       │  │  • Pinecone     │  │  • Claude       │ │
│  │  • Sentence     │  │  • Weaviate     │  │  • Llama        │ │
│  │    Transformers │  │  • Milvus       │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  CHUNKING       │  │  RETRIEVAL      │  │  APPLICATION    │ │
│  │                 │  │  STRATEGY       │  │  LAYER          │ │
│  │                 │  │                 │  │                 │ │
│  │  • Fixed-size   │  │  • Top-K        │  │  • Next.js      │ │
│  │  • Semantic     │  │  • Threshold    │  │  • FastAPI      │ │
│  │  • Recursive    │  │  • Hybrid       │  │  • LangChain    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Key Terminology

| Term | Definition |
|------|------------|
| **Embedding** | Vector representation of text that captures meaning |
| **Vector Database** | Database optimized for storing and querying vectors |
| **Semantic Search** | Finding content by meaning, not exact keywords |
| **Context Window** | Maximum text an LLM can process at once |
| **Chunking** | Splitting documents into smaller pieces |
| **Similarity Score** | How closely a document matches a query (0-1) |

## Next Steps

Now that you understand RAG, learn about the building blocks:

1. [Understanding Embeddings](02-embeddings.md) - How text becomes vectors
2. [Vector Databases](03-vector-databases.md) - Storing and querying embeddings
3. [Building the Pipeline](04-rag-pipeline.md) - Putting it all together

---

[Next: Understanding Embeddings →](02-embeddings.md)
