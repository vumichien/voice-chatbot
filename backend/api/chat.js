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
const { generateSpeech, isConfigured: isTTSConfigured } = require('../lib/tts-service')
const { getCachedAudio, setCachedAudio } = require('../lib/cache')
const { callLLM, getConfiguredProvider } = require('../lib/llm-service')

/**
 * Main chat endpoint handler
 */
module.exports = async (req, res) => {
  // Determine allowed origin
  const allowedOrigins = [
    'https://frontend-vumichies-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ]
  const origin = req.headers.origin
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : '*'

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    applyCorsHeaders(res, allowedOrigin)
    return res.status(200).end()
  }

  // Apply CORS headers
  applyCorsHeaders(res, allowedOrigin)

  // Only accept POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Security checks
  const security = securityMiddleware(req, {
    requireApiKey: false,  // Public chatbot - no API key required
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
      model: process.env.EMBEDDING_MODEL || 'ibm-granite'
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
      .map((result) => result.metadata.content)
      .join('\n\n')

    // STEP 4: Generate response with LLM
    console.log('[Chat] Step 3: Generating response with LLM...')

    const systemPrompt = `あなたは青木仁志です。ユーザーの質問に、あなた自身として直接答えてください。

以下はあなた自身の知識と経験です:

${context}

回答ルール:
1. 一人称（私、僕）で話してください
2. 自分の経験として語ってください
3. 上記の知識にない内容は「その話は今回触れていませんね」と答えてください
4. 「〜によると」「〜と言っています」などの第三者表現は使わないでください
5. 自然で温かい日本語で、自分の言葉として話してください
6. **極めて重要**: 簡潔に答えてください。核心となるポイントに集中し、2-3文で完結させてください
7. 回答は必ず150字以内に収めてください。冗長な説明や繰り返しは避けてください
8. 強調したい言葉は**太字**で囲んでください（例：**100%必要**）

あなたは青木仁志本人です。他の誰かの意見を紹介するのではなく、あなた自身の考えを述べてください。`

    console.log('[Chat] System prompt length:', systemPrompt.length)
    console.log('[Chat] Context chunks:', searchResults.length)

    // Get LLM provider from config (with intelligent fallback)
    const llmProvider = getConfiguredProvider()
    if (!llmProvider) {
      throw new Error('No LLM provider configured. Please set LLM_PROVIDER and corresponding API key (OPENAI_API_KEY or OPENROUTER_API_KEY)')
    }
    console.log(`[Chat] Using LLM provider: ${llmProvider}`)

    const llmResponse = await callLLM({
      provider: llmProvider,
      system: systemPrompt,
      conversationHistory,
      currentMessage: message
    })

    // Log full response for debugging
    console.log('[Chat] Full LLM Response:')
    console.log('='.repeat(80))
    console.log(llmResponse)
    console.log('='.repeat(80))
    console.log('[Chat] Response length:', llmResponse.length)

    // STEP 5: Generate audio from response (with caching)
    let audioBase64 = null
    let audioGenerated = false
    let audioFromCache = false

    if (isTTSConfigured()) {
      try {
        console.log('[Chat] Checking audio cache...')
        audioBase64 = getCachedAudio(llmResponse)

        if (audioBase64) {
          audioFromCache = true
          audioGenerated = true
          console.log('[Chat] Using cached audio')
        } else {
          console.log('[Chat] Generating audio with TTS...')
          audioBase64 = await generateSpeech(llmResponse)
          
          // Cache the generated audio
          setCachedAudio(llmResponse, audioBase64)
          audioGenerated = true
          audioFromCache = false
          console.log('[Chat] Audio generated and cached')
        }
      } catch (ttsError) {
        console.error('[Chat] TTS Error (continuing without audio):', ttsError.message)
        // Continue without audio if TTS fails
      }
    } else {
      console.log('[Chat] TTS not configured, skipping audio generation')
    }

    // STEP 6: Format sources
    const sources = searchResults.map(result => ({
      text: result.metadata.content.substring(0, 200) + (result.metadata.content.length > 200 ? '...' : ''),
      timestamp: result.metadata.timestamp,
      topic: result.metadata.topic,
      relevanceScore: result.score
    }))

    const processingTime = Date.now() - startTime
    console.log(`[Chat] Response generated in ${processingTime}ms`)

    // Return response with audio
    const responseData = {
      response: llmResponse,
      sources,
      conversationId: conversationId || generateId(),
      metadata: {
        retrievedChunks: searchResults.length,
        processingTime,
        audioGenerated,
        audioFromCache
      }
    }

    // Add audio if generated
    if (audioBase64) {
      responseData.audio = audioBase64
    }

    return res.status(200).json(responseData)

  } catch (error) {
    console.error('[Chat] Error:', error)

    // Check if it's an API key issue
    if (error.message && error.message.includes('API key')) {
      const provider = process.env.LLM_PROVIDER || 'openai'
      const keyName = provider === 'openrouter' ? 'OPENROUTER_API_KEY' : 'OPENAI_API_KEY'
      return res.status(500).json({
        error: 'API configuration error',
        message: `Please check ${keyName} is set in environment variables`
      })
    }

    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}


/**
 * Generate conversation ID
 */
function generateId() {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
