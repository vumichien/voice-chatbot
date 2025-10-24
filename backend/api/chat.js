/**
 * Chat API Endpoint
 *
 * Implements RAG (Retrieval-Augmented Generation) pipeline:
 * 1. Generate query embedding
 * 2. Search vector database
 * 3. Construct context from results
 * 4. Call LLM with context
 * 5. Return formatted response with sources
 */

const { searchVectors } = require('../lib/vectordb')
const { generateEmbedding } = require('../lib/embeddings')
const { securityMiddleware, applyCorsHeaders, handlePreflight } = require('../lib/security')
const axios = require('axios')

/**
 * Main chat endpoint handler
 */
module.exports = async (req, res) => {
  // Handle CORS preflight
  if (handlePreflight(req, res)) {
    return
  }

  // Apply CORS headers
  applyCorsHeaders(res)

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Security checks
  const security = securityMiddleware(req, {
    requireApiKey: true,
    enableRateLimit: true,
    rateLimitOptions: {
      windowMs: 60000,  // 1 minute
      maxRequests: 10    // 10 requests per minute
    }
  })

  if (!security.passed) {
    const statusCode = security.error === 'Rate limit exceeded' ? 429 : 401
    return res.status(statusCode).json({
      error: security.error,
      ...(security.retryAfter && { retryAfter: security.retryAfter })
    })
  }

  const startTime = Date.now()

  try {
    const { message, conversationId, conversationHistory = [], language = 'ja' } = req.body

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' })
    }

    if (message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' })
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 chars)' })
    }

    console.log(`[Chat] Received message: ${message.substring(0, 50)}...`)
    console.log(`[Chat] Conversation history: ${conversationHistory.length} messages`)

    // STEP 1: Generate query embedding
    console.log('[Chat] Step 1: Generating query embedding...')
    const queryEmbedding = await generateEmbedding(message, {
      provider: process.env.EMBEDDING_PROVIDER || 'huggingface',
      model: process.env.EMBEDDING_MODEL || 'multilingual-e5-base'
    })

    // STEP 2: Vector search
    console.log('[Chat] Step 2: Searching vector database...')
    const searchResults = await searchVectors(queryEmbedding, {
      provider: process.env.VECTORDB_PROVIDER || 'pinecone',
      indexName: process.env.PINECONE_INDEX_NAME || 'transcript-knowledge',
      namespace: process.env.PINECONE_NAMESPACE || '',
      topK: 5
    })

    if (!searchResults || searchResults.length === 0) {
      console.log('[Chat] No relevant information found')
      return res.json({
        response: '申し訳ございません。関連する情報が見つかりませんでした。',
        sources: [],
        conversationId: conversationId || generateId(),
        metadata: {
          retrievedChunks: 0,
          processingTime: Date.now() - startTime
        }
      })
    }

    console.log(`[Chat] Found ${searchResults.length} relevant chunks`)

    // STEP 3: Build context from retrieved chunks
    const context = searchResults
      .map((result, idx) => {
        return `[ソース ${idx + 1}] ${result.metadata.content}\n(時間: ${result.metadata.timestamp})`
      })
      .join('\n\n')

    // STEP 4: Generate response with LLM
    console.log('[Chat] Step 3: Generating response with LLM...')

    const systemPrompt = `あなたは青木さんです。ユーザーの質問に、青木さん本人として答えてください。

以下はあなた（青木さん）の動画トランスクリプトから抽出した情報です。この情報に基づいて、あなた自身の経験や考えとして答えてください。

重要なルール:
1. あなたは青木さん本人です。一人称（私、僕）を使って答えてください
2. 「私は29歳の時に...」「僕の考えでは...」のように、自分自身の経験として語ってください
3. 提供された知識ベースの情報のみを使用してください
4. 知識ベースにない情報については「その質問については、今回の話では触れていませんね」と答えてください
5. 簡潔で分かりやすく、温かみのある日本語で答えてください
6. 青木さんの話し方や人柄を反映してください

あなた（青木さん）の知識ベース:
${context}`

    const llmResponse = await callOpenRouter({
      system: systemPrompt,
      conversationHistory,
      currentMessage: message,
      model: process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'
    })

    // STEP 5: Format sources
    const sources = searchResults.map(result => ({
      text: result.metadata.content.substring(0, 200) + (result.metadata.content.length > 200 ? '...' : ''),
      timestamp: result.metadata.timestamp,
      topic: result.metadata.topic,
      relevanceScore: result.score
    }))

    const processingTime = Date.now() - startTime
    console.log(`[Chat] Response generated in ${processingTime}ms`)

    // Return response
    return res.status(200).json({
      response: llmResponse,
      sources,
      conversationId: conversationId || generateId(),
      metadata: {
        retrievedChunks: searchResults.length,
        processingTime
      }
    })

  } catch (error) {
    console.error('[Chat] Error:', error)

    // Check if it's an API key issue
    if (error.message && error.message.includes('API key')) {
      return res.status(500).json({
        error: 'API configuration error',
        message: 'Please check OPENROUTER_API_KEY is set in environment variables'
      })
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}

/**
 * Call OpenRouter API with conversation history
 */
async function callOpenRouter({ system, conversationHistory, currentMessage, model }) {
  // Check for API key
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable not set')
  }

  try {
    // Build messages array: system + conversation history + current message
    const messages = [
      { role: 'system', content: system }
    ]

    // Add conversation history (exclude the current message if already in history)
    if (conversationHistory && conversationHistory.length > 0) {
      // Filter out the current message to avoid duplication
      const historyMessages = conversationHistory
        .filter(msg => msg.content !== currentMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      messages.push(...historyMessages)
    }

    // Add current user message
    messages.push({ role: 'user', content: currentMessage })

    console.log(`[OpenRouter] Sending ${messages.length} messages to LLM`)

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Voice Chatbot Knowledge Base'
        },
        timeout: 30000 // 30 second timeout
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    if (error.response) {
      console.error('[OpenRouter] API Error:', error.response.data)
      throw new Error(`OpenRouter API error: ${error.response.data.error?.message || error.response.statusText}`)
    } else if (error.request) {
      console.error('[OpenRouter] No response received')
      throw new Error('OpenRouter API timeout or network error')
    } else {
      throw error
    }
  }
}

/**
 * Generate conversation ID
 */
function generateId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
