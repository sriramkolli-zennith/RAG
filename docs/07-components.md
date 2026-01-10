# 🎨 Frontend Components

This document describes the React components used in the RAG Chatbase Agent.

## Component Overview

```
src/components/
├── ChatInterface.tsx    # Main chat container
├── ChatInput.tsx        # Message input field
├── ChatMessage.tsx      # Individual message display
├── ConversationList.tsx # Sidebar with conversations
├── DocumentUpload.tsx   # File upload modal
├── ExportButton.tsx     # Export conversation
├── Header.tsx           # App header
└── SourcesPanel.tsx     # Source documents panel
```

## ChatInterface

The main orchestrating component that manages the chat experience.

**File:** [src/components/ChatInterface.tsx](../src/components/ChatInterface.tsx)

### Features
- Conversation management
- Message history
- Auto-scrolling
- Streaming response support
- Error handling

### State Management

```typescript
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  sources?: any[];
  created_at?: string;
}

// Key state
const [messages, setMessages] = useState<Message[]>([]);
const [loading, setLoading] = useState(false);
const [conversationId, setConversationId] = useState<string>();
const [sidebarOpen, setSidebarOpen] = useState(true);
```

### Key Functions

```typescript
// Send a message to the RAG API
const handleSendMessage = async (message: string) => {
  // 1. Create conversation if needed
  // 2. Add user message to UI
  // 3. Show loading state
  // 4. Call /api/chat
  // 5. Update with response + sources
};

// Load existing conversation
const loadConversationMessages = async (convId: string) => {
  const response = await fetch(`/api/conversations/${convId}/messages`);
  // Update messages state
};

// Create new conversation
const handleNewConversation = async () => {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    body: JSON.stringify({ sessionId, title }),
  });
};
```

### Usage

```tsx
// src/app/page.tsx
import ChatInterface from '@/components/ChatInterface';

export default function HomePage() {
  return <ChatInterface />;
}
```

---

## ChatInput

The message input component with send functionality.

**File:** [src/components/ChatInput.tsx](../src/components/ChatInput.tsx)

### Props

```typescript
interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

### Features
- Multi-line text input
- Enter to send (Shift+Enter for new line)
- Disabled state during loading
- Auto-focus

### Example

```tsx
<ChatInput
  onSend={(message) => handleSendMessage(message)}
  disabled={loading}
  placeholder="Ask a question about your documents..."
/>
```

---

## ChatMessage

Displays individual chat messages with role-based styling.

**File:** [src/components/ChatMessage.tsx](../src/components/ChatMessage.tsx)

### Props

```typescript
interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    sources?: Source[];
  };
  onRegenerate?: (messageId: string) => void;
}
```

### Features
- Markdown rendering (react-markdown)
- User vs assistant styling
- Source citation display
- Regenerate button for assistant messages
- Copy to clipboard

### Styling

```tsx
// User messages - right aligned, dark background
<div className="bg-slate-800 rounded-lg p-4 ml-12">

// Assistant messages - left aligned, darker background
<div className="bg-slate-900 rounded-lg p-4 mr-12">
```

---

## ConversationList

Sidebar component showing all conversations.

**File:** [src/components/ConversationList.tsx](../src/components/ConversationList.tsx)

### Props

```typescript
interface ConversationListProps {
  onSelect: (conversationId: string) => void;
  onNew: () => void;
  selectedId?: string;
}
```

### Features
- List all conversations
- Highlight selected conversation
- New conversation button
- Auto-refresh
- Delete conversation

### API Integration

```typescript
// Fetch conversations
const fetchConversations = async () => {
  const response = await fetch('/api/conversations');
  const data = await response.json();
  setConversations(data.data);
};
```

---

## DocumentUpload

Modal component for uploading documents to the knowledge base.

**File:** [src/components/DocumentUpload.tsx](../src/components/DocumentUpload.tsx)

### Props

```typescript
interface DocumentUploadProps {
  onUploadComplete?: (count: number) => void;
}
```

### Features
- Multi-file selection
- Drag and drop support
- File type validation (TXT, MD, DOC, DOCX, PDF)
- Upload progress indication
- File list with remove option

### Supported Files

```typescript
const ACCEPTED_TYPES = '.txt,.md,.doc,.docx,.pdf';
```

### Upload Flow

```typescript
const handleUpload = async () => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });
  
  // Handle response
  const data = await response.json();
  onUploadComplete?.(data.data?.count);
};
```

### UI States

1. **Closed** - Just the trigger button
2. **Open** - Modal with file selector
3. **Files Selected** - Shows file list
4. **Uploading** - Progress indicator
5. **Complete** - Success message, auto-close

---

## SourcesPanel

Displays source documents used to generate a response.

**File:** [src/components/SourcesPanel.tsx](../src/components/SourcesPanel.tsx)

### Props

```typescript
interface SourcesPanelProps {
  sources: Array<{
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    similarity: number;
  }>;
}
```

### Features
- Expandable/collapsible
- Source content preview
- Similarity score display
- Metadata display (source name, etc.)

### Display Format

```tsx
// Each source shows:
// - Source name from metadata
// - Similarity percentage (e.g., "92% match")
// - Content preview (truncated)
```

---

## ExportButton

Export conversation history in various formats.

**File:** [src/components/ExportButton.tsx](../src/components/ExportButton.tsx)

### Props

```typescript
interface ExportButtonProps {
  conversationId: string;
  format?: 'json' | 'markdown' | 'txt';
}
```

### Export Formats

1. **JSON** - Full structured data
2. **Markdown** - Formatted for reading
3. **TXT** - Plain text

---

## Header

Application header with navigation and branding.

**File:** [src/components/Header.tsx](../src/components/Header.tsx)

### Features
- Logo/title
- Navigation links
- Admin link
- Theme toggle (if implemented)

---

## Component Patterns

### 1. Client Components

All interactive components use the `'use client'` directive:

```tsx
'use client';

import { useState, useEffect } from 'react';
// ...
```

### 2. Callback Optimization

Use `useCallback` for event handlers:

```typescript
const handleSendMessage = useCallback(async (message: string) => {
  // Handler logic
}, [dependencies]);
```

### 3. Ref for Stable Values

Use `useRef` for values that shouldn't trigger re-renders:

```typescript
const sessionIdRef = useRef(uuidv4());
```

### 4. Auto-scroll Pattern

```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const timer = setTimeout(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, 100);
  return () => clearTimeout(timer);
}, [messages]);

// In JSX:
<div ref={messagesEndRef} />
```

### 5. Loading States

```typescript
const [loading, setLoading] = useState(false);

try {
  setLoading(true);
  // API call
} finally {
  setLoading(false);
}

// In JSX:
<button disabled={loading}>
  {loading ? 'Loading...' : 'Send'}
</button>
```

---

## Styling

### TailwindCSS Classes

Common patterns used throughout:

```tsx
// Card/Panel
"bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50"

// Button (Primary)
"bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white"

// Input
"bg-slate-800/50 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-blue-500"

// Text
"text-white"        // Primary
"text-slate-400"    // Secondary
"text-blue-400"     // Links/accent
```

### Responsive Design

```tsx
// Sidebar hidden on mobile
<div className="hidden md:block w-64">

// Full width on mobile, constrained on desktop
<div className="w-full md:max-w-2xl">
```

---

## Admin Dashboard

**File:** [src/app/admin/page.tsx](../src/app/admin/page.tsx)

A special page for managing the knowledge base:

### Features
- Document list with delete
- Manual document entry
- File upload integration
- Analytics display (conversations, messages)

### Layout

```
┌─────────────────────────────────────────────────┐
│  Admin Dashboard                  [Upload Docs] │
├─────────────────────────────────────────────────┤
│  Analytics Cards                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Convos  │  │Messages │  │Documents│        │
│  └─────────┘  └─────────┘  └─────────┘        │
├─────────────────────────────────────────────────┤
│  Add New Document                               │
│  ┌─────────────────────────────────────────┐   │
│  │ [Content textarea]                       │   │
│  │ [Source input]              [Add Button] │   │
│  └─────────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  Document List                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ Document 1          [Delete]            │   │
│  │ Document 2          [Delete]            │   │
│  │ ...                                     │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## Icon Library

Using **Lucide React** for icons:

```tsx
import { 
  Menu, 
  X, 
  Send, 
  Upload, 
  FileText, 
  Loader2,
  Trash2,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';

// Usage
<Send size={20} className="text-white" />
```

---

[← Previous: Architecture](06-architecture.md) | [Next: Local Embeddings →](local-embeddings.md)
