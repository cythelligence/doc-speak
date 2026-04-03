# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Vendors

#### Get Available Vendors

Get a list of all vendors with active vector collections in ChromaDB.

```
GET /api/vendors
```

**Response:**
```json
[
  "vendor-a",
  "vendor-b",
  "vendor-c"
]
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### Chat Sessions

#### List All Sessions

Retrieve all chat sessions, ordered by most recent first.

```
GET /api/sessions
```

**Response:**
```json
[
  {
    "id": "clxx000000xxxxx",
    "title": "Deployment Questions",
    "createdAt": "2024-04-03T10:30:00Z",
    "vendorIds": "[\"vendor-a\",\"vendor-b\"]"
  }
]
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

#### Create New Session

Create a new chat session for a specific set of vendors.

```
POST /api/sessions
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Setup and Installation",
  "vendorIds": ["vendor-a", "vendor-b"]
}
```

**Response:**
```json
{
  "id": "clxx000000xxxxx",
  "title": "Setup and Installation",
  "createdAt": "2024-04-03T10:35:00Z",
  "vendorIds": "[\"vendor-a\",\"vendor-b\"]"
}
```

**Status Codes:**
- `201` - Created
- `400` - Invalid request
- `500` - Server error

---

#### Get Session Messages

Retrieve all messages in a specific chat session, ordered chronologically.

```
GET /api/sessions/{sessionId}/messages
```

**Parameters:**
- `sessionId` (URL parameter) - The session ID

**Response:**
```json
[
  {
    "id": "msg000001",
    "sessionId": "clxx000000xxxxx",
    "role": "user",
    "content": "How do I deploy to production?",
    "createdAt": "2024-04-03T10:35:10Z"
  },
  {
    "id": "msg000002",
    "sessionId": "clxx000000xxxxx",
    "role": "assistant",
    "content": "To deploy to production, follow these steps...",
    "createdAt": "2024-04-03T10:35:15Z"
  }
]
```

**Status Codes:**
- `200` - Success
- `404` - Session not found
- `500` - Server error

---

### Chat & Queries

#### Send Message and Get Response

Send a message to a chat session and receive an AI-generated response from the selected vendors' documentation.

```
POST /api/chat/{sessionId}
Content-Type: application/json
```

**Parameters:**
- `sessionId` (URL parameter) - The session ID

**Request Body:**
```json
{
  "message": "What are the system requirements?",
  "vendorIds": ["vendor-a"]
}
```

**Response:**
```json
{
  "userMessage": {
    "id": "msg000003",
    "sessionId": "clxx000000xxxxx",
    "role": "user",
    "content": "What are the system requirements?",
    "createdAt": "2024-04-03T10:40:00Z"
  },
  "assistantMessage": {
    "id": "msg000004",
    "sessionId": "clxx000000xxxxx",
    "role": "assistant",
    "content": "System requirements include...",
    "createdAt": "2024-04-03T10:40:05Z"
  },
  "sources": [
    {
      "vendorId": "vendor-a",
      "content": "System Requirements: Node.js v20+, 8GB RAM, 1GB disk space...",
      "distance": 0.15
    }
  ],
  "model": "mistral",
  "provider": "ollama"
}
```

**Query Parameters:**
- `message` (required) - The user's question/message
- `vendorIds` (required) - Array of vendor IDs to search

**Response Fields:**
- `userMessage` - The stored user message
- `assistantMessage` - The stored AI response
- `sources` - Relevant source documents used to generate the answer
  - `vendorId` - The vendor this source came from
  - `content` - Excerpt from the source document (max 200 chars)
  - `distance` - Semantic distance score (0-1, lower is better relevance)
- `model` - The LLM model used (e.g., "mistral", "gpt-4")
- `provider` - The LLM provider (e.g., "ollama", "copilot")

**Status Codes:**
- `200` - Success
- `400` - Missing required fields
- `500` - Server error

---

## Error Handling

All endpoints return errors in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

**Common Errors:**

| Status | Message | Solution |
|--------|---------|----------|
| 400 | Missing message or vendorIds | Include both fields in request body |
| 404 | Session not found | Verify sessionId is correct |
| 500 | Ollama is not running | Start Ollama: `ollama serve` |
| 500 | No vendors available | Run crawler and ingest documents |

---

## Rate Limiting

Currently, there are no built-in rate limits. For production, consider adding:
- Per-IP rate limiting
- Per-session message limits
- Query timeout limits

---

## Authentication

Currently, no authentication is required. For production, add:
- API key authentication
- JWT tokens
- Session validation

---

## Examples

### cURL Examples

#### Create a session
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Chat",
    "vendorIds": ["vendor-a"]
  }'
```

#### Send a message
```bash
curl -X POST http://localhost:3000/api/chat/clxx000000xxxxx \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I install?",
    "vendorIds": ["vendor-a"]
  }'
```

#### List sessions
```bash
curl http://localhost:3000/api/sessions
```

### JavaScript/Fetch Examples

```javascript
// Create session
const sessionRes = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'New Chat',
    vendorIds: ['vendor-a', 'vendor-b']
  })
});
const session = await sessionRes.json();

// Send message
const response = await fetch(`/api/chat/${session.id}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Your question here',
    vendorIds: ['vendor-a', 'vendor-b']
  })
});

// Get messages
const messagesRes = await fetch(`/api/sessions/${session.id}/messages`);
const messages = await messagesRes.json();
```

### Python Examples

```python
import requests

# Create session
response = requests.post('http://localhost:3000/api/sessions', json={
    'title': 'New Chat',
    'vendorIds': ['vendor-a']
})
session_id = response.json()['id']

# Send message
query_response = requests.post(
    f'http://localhost:3000/api/chat/{session_id}',
    json={
        'message': 'Your question here',
        'vendorIds': ['vendor-a']
    }
)
answer = query_response.json()['assistantMessage']['content']
```

---

## Performance Notes

- **Initial Query**: 2-5 seconds (embedding generation + search)
- **Subsequent Queries**: 1-3 seconds (cached embeddings)
- **Timeout**: 120 seconds for LLM response generation
- **Max Results**: 10 source documents per query

---

## Versioning

Current API version: **v1** (unstable - breaking changes possible)

Future versions may include:
- Pagination for sessions/messages
- Filtering and sorting options
- Streaming responses
- Batch operations

---

## WebSocket Support (Planned)

For real-time streaming responses, WebSocket endpoints are planned:

```
WS /api/ws/chat/{sessionId}
```

Subscribe to updates and receive streamed LLM responses in real-time.
