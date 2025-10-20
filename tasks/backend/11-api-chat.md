# Task 11: API - Chat Endpoint

**Status**: [ ] TODO
**Estimated Time**: 4 hours
**Dependencies**: Tasks 01-10 (Complete pipeline + Vector DB)
**Priority**: HIGH
**File**: `api/chat.js`

---

## 📋 Description

Create the main chat API endpoint that implements the RAG (Retrieval-Augmented Generation) pipeline to answer user questions based on the knowledge base.

---

## 🎯 Goals

1. Create `/api/chat` POST endpoint
2. Implement RAG pipeline (query → retrieve → generate)
3. Integrate with vector database for retrieval
4. Call OpenRouter LLM for response generation
5. Return formatted response with sources
6. Handle errors gracefully
7. Add request validation

---

## ✅ Acceptance Criteria

- [ ] POST `/api/chat` accepts JSON requests
- [ ] Validates input (message required, max length)
- [ ] Generates query embedding
- [ ] Retrieves top-K relevant chunks from vector DB
- [ ] Constructs context for LLM
- [ ] Calls OpenRouter API with proper prompts
- [ ] Returns JSON response with answer + sources
- [ ] Response time < 3 seconds for 95% of requests
- [ ] Handles errors with appropriate status codes

---

## 🔧 Implementation

### api/chat.js

```javascript
const { vectorDB } = require('../lib/vectordb')
const { generateEmbedding } = require('../lib/embeddings')
const axios = require('axios')

/**
 * Main chat endpoint
 */
module.exports = async (req, res) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, conversationId, language = 'ja' } = req.body

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' })
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 chars)' })
    }

    console.log(`[Chat] Received message: ${message.substring(0, 50)}...`)

    // STEP 1: Generate query embedding
    const queryEmbedding = await generateEmbedding(message)

    // STEP 2: Vector search
    const searchResults = await vectorDB.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true
    })

    if (!searchResults || searchResults.length === 0) {
      return res.json({
        response: '申し訳ございません。関連する情報が見つかりませんでした。',
        sources: [],
        conversationId: conversationId || generateId()
      })
    }

    console.log(`[Chat] Found ${searchResults.length} relevant chunks`)

    // STEP 3: Build context from retrieved chunks
    const context = searchResults
      .map((result, idx) => {
        return `[Source ${idx + 1}] ${result.metadata.content}\n(Timestamp: ${result.metadata.timestamp})`
      })
      .join('\n\n')

    // STEP 4: Generate response with LLM
    const systemPrompt = `あなたは青木さんの教えに基づいて質問に答えるAIアシスタントです。

以下の知識ベースを使用して、ユーザーの質問に正確かつ丁寧に答えてください。

重要なルール:
1. 提供された知識ベースの情報のみを使用してください
2. 知識ベースにない情報については「情報がありません」と答えてください
3. 引用する場合は、該当するソースを参照してください
4. 簡潔で分かりやすい日本語で答えてください
5. 青木さんの言葉や教えを尊重してください

知識ベース:
${context}`

    const llmResponse = await callOpenRouter({
      system: systemPrompt,
      user: message,
      model: 'openai/gpt-4o-mini-2024-07-18'
    })

    // STEP 5: Format sources
    const sources = searchResults.map(result => ({
      text: result.metadata.content.substring(0, 200) + '...',
      timestamp: result.metadata.timestamp,
      topic: result.metadata.topic,
      relevanceScore: result.score
    }))

    // Return response
    return res.status(200).json({
      response: llmResponse,
      sources,
      conversationId: conversationId || generateId(),
      metadata: {
        retrievedChunks: searchResults.length,
        processingTime: Date.now() - startTime
      }
    })

  } catch (error) {
    console.error('[Chat] Error:', error)

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter({ system, user, model }) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.7,
      max_tokens: 500
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://your-app.vercel.app',
        'X-Title': 'Voice Chatbot'
      }
    }
  )

  return response.data.choices[0].message.content
}

/**
 * Generate conversation ID
 */
function generateId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
```

---

## 🧪 Testing Checklist

### Unit Tests

```javascript
// Mock test for API endpoint logic
describe('Chat API', () => {
  test('validates required message field', async () => {
    const req = { method: 'POST', body: {} }
    const res = { status: jest.fn(() => ({ json: jest.fn() })) }

    await chatHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('rejects non-POST requests', async () => {
    const req = { method: 'GET', body: {} }
    const res = { status: jest.fn(() => ({ json: jest.fn() })) }

    await chatHandler(req, res)

    expect(res.status).toHaveBeenCalledWith(405)
  })
})
```

### Integration Tests

- [ ] **Test with real question**:
  ```bash
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -d '{
      "message": "青木さんが29歳の時に出会ったものは何ですか？"
    }'
  ```

- [ ] **Expected response**:
  ```json
  {
    "response": "青木さんは29歳でバイブル（聖書）と出会いました。そこで黄金率という教えを知り、人生が変わりました。",
    "sources": [
      {
        "text": "29歳でバイブルと出会って...",
        "timestamp": "00:01:19,320 --> 00:01:44,880",
        "topic": "黄金率と価値観",
        "relevanceScore": 0.92
      }
    ],
    "conversationId": "conv_1234567890_abc123"
  }
  ```

### Manual Testing

Test with these questions:

1. **Factual**: "青木さんが29歳の時に出会ったものは何ですか？"
   - Should return: バイブル, 黄金率
   - Should cite correct timestamp

2. **Conceptual**: "黄金率とは何ですか？"
   - Should return full explanation with quote
   - Should reference マタイ7章12節

3. **Advice**: "価値観が合わない人とどう付き合うべきですか？"
   - Should return practical advice
   - Should include relevant quotes

4. **Unknown**: "青木さんの好きな食べ物は何ですか？"
   - Should return "情報がありません"

5. **Edge cases**:
   - Empty message → 400 error
   - Very long message (>1000 chars) → 400 error
   - Invalid JSON → 400 error

---

## 📊 Performance Requirements

- [ ] **Response time**: < 3 seconds for 95% of requests
  - Vector search: < 500ms
  - LLM generation: < 2s
  - Total: < 3s

- [ ] **Accuracy**: > 85% relevant responses
  - Test with 20 questions
  - Verify sources are correct

- [ ] **Error handling**: All errors return proper status codes
  - 400: Bad request
  - 405: Method not allowed
  - 500: Internal error

---

## ⚙️ Environment Variables Required

```env
OPENROUTER_API_KEY=your_key_here
PINECONE_API_KEY=your_key_here
PINECONE_INDEX_NAME=transcript-knowledge
OPENAI_API_KEY=your_key_here
```

---

## ⚠️ Common Issues & Solutions

### Issue: Vector search returns no results
- **Cause**: Index not populated or different namespace
- **Solution**: Verify DB is populated, check namespace

### Issue: LLM response is hallucinated
- **Cause**: Weak system prompt
- **Solution**: Strengthen prompt to stick to knowledge base only

### Issue: Timeout (>10s on Vercel)
- **Cause**: Slow LLM or vector search
- **Solution**: Reduce topK, optimize prompts, use faster model

---

## ✨ Success Criteria

Task is complete when:
1. ✅ API endpoint created and deployed
2. ✅ Can answer test questions accurately
3. ✅ Returns proper sources with timestamps
4. ✅ Response time < 3 seconds
5. ✅ Error handling works correctly
6. ✅ All integration tests pass

---

## 📌 Next Task

**Task 12: API - Health & Initialize Endpoints** (`tasks/backend/12-api-other.md`)

---

**Status**: [ ] TODO
**Started**: _____
**Completed**: _____
