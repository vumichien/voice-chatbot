/**
 * Local Development Server
 *
 * Simple Express server to run the API locally for testing
 */

const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { getConfiguredProvider, getAvailableProviders, isProviderConfigured } = require('./lib/llm-service')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
app.post('/api/chat', require('./api/chat'))

// Health check
app.get('/api/health', (req, res) => {
  const llmProvider = getConfiguredProvider()
  const availableProviders = getAvailableProviders()
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      llmProvider: llmProvider || 'none',
      availableLLMProviders: availableProviders,
      hasOpenAI: isProviderConfigured('openai'),
      hasOpenRouter: isProviderConfigured('openrouter'),
      hasHuggingFace: !!process.env.HUGGINGFACE_API_KEY,
      hasPinecone: !!process.env.PINECONE_API_KEY
    }
  })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Voice Chatbot API',
    version: '1.0.0',
    endpoints: [
      { method: 'POST', path: '/api/chat', description: 'Chat with knowledge base' },
      { method: 'GET', path: '/api/health', description: 'Health check' }
    ]
  })
})

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(80))
  console.log('🚀 VOICE CHATBOT BACKEND SERVER')
  console.log('='.repeat(80))

  console.log(`\n📡 Server Information:`)
  console.log(`   URL: http://localhost:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Time: ${new Date().toLocaleString()}`)

  // Get LLM provider info
  const llmProvider = getConfiguredProvider() || process.env.LLM_PROVIDER || 'openai'
  const availableProviders = getAvailableProviders()

  console.log(`\n🔑 Environment Variables:`)
  console.log(`   HUGGINGFACE_API_KEY: ${process.env.HUGGINGFACE_API_KEY ? '✓ Set (' + process.env.HUGGINGFACE_API_KEY.substring(0, 10) + '...)' : '✗ Not set'}`)
  console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✓ Set (' + process.env.OPENAI_API_KEY.substring(0, 10) + '...)' : '✗ Not set'}`)
  console.log(`   OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✓ Set (' + process.env.OPENROUTER_API_KEY.substring(0, 15) + '...)' : '✗ Not set'}`)
  console.log(`   PINECONE_API_KEY: ${process.env.PINECONE_API_KEY ? '✓ Set (' + process.env.PINECONE_API_KEY.substring(0, 10) + '...)' : '✗ Not set'}`)
  console.log(`   UPSTASH_VECTOR_URL: ${process.env.UPSTASH_VECTOR_URL ? '✓ Set' : '✗ Not set'}`)
  console.log(`   UPSTASH_VECTOR_TOKEN: ${process.env.UPSTASH_VECTOR_TOKEN ? '✓ Set' : '✗ Not set'}`)

  console.log(`\n⚙️  Configuration:`)
  console.log(`   LLM Provider: ${llmProvider} ${availableProviders.length > 0 ? `(available: ${availableProviders.join(', ')})` : '(none configured)'}`)
  if (llmProvider === 'openai') {
    console.log(`   OpenAI Model: ${process.env.OPENAI_MODEL || 'gpt-5-nano (default)'}`)
  } else if (llmProvider === 'openrouter') {
    console.log(`   OpenRouter Model: ${process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free (default)'}`)
  }
  console.log(`   Embedding Provider: ${process.env.EMBEDDING_PROVIDER || 'huggingface (default)'}`)
  console.log(`   Embedding Model: ${process.env.EMBEDDING_MODEL || 'ibm-granite (default)'}`)
  console.log(`   Vector DB Provider: ${process.env.VECTORDB_PROVIDER || 'pinecone (default)'}`)
  console.log(`   Pinecone Index: ${process.env.PINECONE_INDEX_NAME || 'transcript-knowledge (default)'}`)

  console.log(`\n📡 Available Endpoints:`)
  console.log(`   GET  http://localhost:${PORT}/`)
  console.log(`   GET  http://localhost:${PORT}/api/health`)
  console.log(`   POST http://localhost:${PORT}/api/chat`)

  // Check for missing critical keys
  const missing = []
  if (!process.env.HUGGINGFACE_API_KEY && !process.env.OPENAI_API_KEY) {
    missing.push('Embedding API (HUGGINGFACE_API_KEY or OPENAI_API_KEY)')
  }
  if (!llmProvider || availableProviders.length === 0) {
    // Determine which key is missing based on configured provider or available providers
    const configuredProvider = process.env.LLM_PROVIDER || 'openai'
    let missingKey = 'OPENAI_API_KEY'
    if (configuredProvider === 'openrouter') {
      missingKey = 'OPENROUTER_API_KEY'
    } else if (availableProviders.length > 0) {
      // If a provider is configured but not available, use the first available as hint
      missingKey = availableProviders[0] === 'openrouter' ? 'OPENROUTER_API_KEY' : 'OPENAI_API_KEY'
    }
    missing.push(`LLM Provider (${missingKey} not set for ${configuredProvider})`)
  }
  if (!process.env.PINECONE_API_KEY && !process.env.UPSTASH_VECTOR_URL) {
    missing.push('Vector DB (PINECONE_API_KEY or UPSTASH_VECTOR_URL)')
  }

  if (missing.length > 0) {
    console.log(`\n⚠️  WARNING: Missing API Keys:`)
    missing.forEach(key => console.log(`   ✗ ${key}`))
    console.log(`\n   The server will start but API calls may fail.`)
    console.log(`   Please check your .env file.`)
  } else {
    console.log(`\n✅ All required API keys are set!`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Ready to accept requests!')
  console.log('='.repeat(80) + '\n')
})
