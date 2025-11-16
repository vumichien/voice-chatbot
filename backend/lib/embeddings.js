/**
 * Stage 6: Embeddings Generator
 *
 * Generates vector embeddings for semantic chunks.
 * Supports OpenAI and HuggingFace models (optimized for Japanese).
 */

const OpenAI = require('openai')
const { HfInference } = require('@huggingface/inference')

// Initialize clients (lazy loading)
let openaiClient = null
let hfClient = null

/**
 * Recommended Japanese embedding models
 */
const JAPANESE_MODELS = {
  // Multilingual E5 - Best for Japanese semantic search
  'multilingual-e5-large': {
    name: 'intfloat/multilingual-e5-large',
    dimensions: 1024,
    prefix: 'query: ', // Required prefix for E5 models
    description: 'Best quality for Japanese (1024 dims)'
  },
  'multilingual-e5-base': {
    name: 'intfloat/multilingual-e5-base',
    dimensions: 768,
    prefix: 'query: ',
    description: 'Good balance for Japanese (768 dims)'
  },
  'multilingual-e5-small': {
    name: 'intfloat/multilingual-e5-small',
    dimensions: 384,
    prefix: 'query: ',
    description: 'Fast and efficient (384 dims)'
  },
  // Sentence transformers - also good for Japanese
  'paraphrase-multilingual': {
    name: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
    dimensions: 384,
    prefix: '',
    description: 'Lightweight multilingual (384 dims)'
  },
  // IBM Granite models
  'ibm-granite': {
    name: 'ibm-granite/granite-embedding-278m-multilingual',
    dimensions: 768,
    prefix: '',
    description: 'IBM Granite multilingual (768 dims)'
  },
  // OpenAI models
  'openai-small': {
    name: 'text-embedding-3-small',
    dimensions: 1536,
    prefix: '',
    description: 'OpenAI small (1536 dims)'
  },
  'openai-large': {
    name: 'text-embedding-3-large',
    dimensions: 3072,
    prefix: '',
    description: 'OpenAI large (3072 dims)'
  }
}

/**
 * Get OpenAI client
 */
function getOpenAIClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable not set')
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }
  return openaiClient
}

/**
 * Get HuggingFace client
 */
function getHFClient() {
  if (!hfClient) {
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY or HF_TOKEN environment variable not set')
    }
    hfClient = new HfInference(apiKey)
  }
  return hfClient
}

/**
 * Prepare text for embedding
 * Combines topic + entities + content for better semantic search
 */
function prepareTextForEmbedding(chunk, options = {}) {
  const parts = []

  // Add topic
  if (chunk.metadata.topic) {
    parts.push(`Topic: ${chunk.metadata.topic}`)
  }

  // Add key entities
  if (chunk.metadata.entities) {
    const allEntities = [
      ...(chunk.metadata.entities.people || []),
      ...(chunk.metadata.entities.concepts || []),
      ...(chunk.metadata.entities.organizations || [])
    ]
    if (allEntities.length > 0) {
      parts.push(`Entities: ${allEntities.join(', ')}`)
    }
  }

  // Add main content
  parts.push(chunk.content)

  let text = parts.join('\n\n')

  // Add model-specific prefix if needed
  if (options.prefix) {
    text = options.prefix + text
  }

  return text
}

/**
 * Generate embedding using OpenAI
 */
async function generateOpenAIEmbedding(text, model = 'text-embedding-3-small', retries = 3) {
  const client = getOpenAIClient()

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.embeddings.create({
        model: model,
        input: text,
        encoding_format: 'float'
      })

      return response.data[0].embedding
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed to generate OpenAI embedding after ${retries} attempts: ${error.message}`)
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000
      console.log(`   OpenAI retry ${attempt}/${retries} after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * Generate embedding using HuggingFace
 */
async function generateHFEmbedding(text, model = 'intfloat/multilingual-e5-large', retries = 3) {
  const client = getHFClient()

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.featureExtraction({
        model: model,
        inputs: text
      })

      // HF returns array, flatten if needed
      if (Array.isArray(response) && Array.isArray(response[0])) {
        return response[0]
      }
      return response
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed to generate HF embedding after ${retries} attempts: ${error.message}`)
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000
      console.log(`   HF retry ${attempt}/${retries} after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * Generate embedding for a single text
 */
async function generateEmbedding(text, options = {}) {
  const {
    provider = 'huggingface', // 'openai' or 'huggingface'
    model = 'ibm-granite',
    retries = 3
  } = options

  // Get model config
  const modelConfig = JAPANESE_MODELS[model]
  if (!modelConfig) {
    throw new Error(`Unknown model: ${model}. Available: ${Object.keys(JAPANESE_MODELS).join(', ')}`)
  }

  // Add prefix if needed
  const textWithPrefix = modelConfig.prefix ? modelConfig.prefix + text : text

  // Generate embedding based on provider
  if (provider === 'openai' || model.startsWith('openai-')) {
    return await generateOpenAIEmbedding(textWithPrefix, modelConfig.name, retries)
  } else {
    return await generateHFEmbedding(textWithPrefix, modelConfig.name, retries)
  }
}

/**
 * Generate embeddings for multiple texts in batch (OpenAI only)
 */
async function generateBatchEmbeddings(texts, options = {}) {
  const {
    provider = 'huggingface',
    model = 'ibm-granite',
    retries = 3
  } = options

  const modelConfig = JAPANESE_MODELS[model]
  if (!modelConfig) {
    throw new Error(`Unknown model: ${model}`)
  }

  // OpenAI supports batch
  if (provider === 'openai' || model.startsWith('openai-')) {
    const client = getOpenAIClient()

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await client.embeddings.create({
          model: modelConfig.name,
          input: texts,
          encoding_format: 'float'
        })

        return response.data.map(item => item.embedding)
      } catch (error) {
        if (attempt === retries) {
          throw new Error(`Failed to generate batch embeddings after ${retries} attempts: ${error.message}`)
        }

        const delay = Math.pow(2, attempt) * 1000
        console.log(`   Batch retry ${attempt}/${retries} after ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  } else {
    // HF: generate one by one
    const embeddings = []
    for (const text of texts) {
      const textWithPrefix = modelConfig.prefix ? modelConfig.prefix + text : text
      const embedding = await generateHFEmbedding(textWithPrefix, modelConfig.name, retries)
      embeddings.push(embedding)
    }
    return embeddings
  }
}

/**
 * Process chunks in batches
 */
async function processBatch(chunks, options = {}) {
  const {
    provider = 'huggingface',
    model = 'ibm-granite',
    batchSize = 100,
    onProgress = null
  } = options

  const modelConfig = JAPANESE_MODELS[model]
  const results = []
  const totalBatches = Math.ceil(chunks.length / batchSize)

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchNum = Math.floor(i / batchSize) + 1
    const batch = chunks.slice(i, i + batchSize)

    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`)

    // Prepare texts for batch
    const texts = batch.map(chunk => prepareTextForEmbedding(chunk, { prefix: modelConfig.prefix }))

    // Generate embeddings
    const embeddings = await generateBatchEmbeddings(texts, { provider, model })

    // Combine chunks with embeddings
    const enrichedChunks = batch.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
      embeddingMetadata: {
        provider,
        model: modelConfig.name,
        modelAlias: model,
        dimensions: embeddings[index].length,
        generatedAt: new Date().toISOString()
      }
    }))

    results.push(...enrichedChunks)

    if (onProgress) {
      onProgress({
        batchNum,
        totalBatches,
        processed: results.length,
        total: chunks.length,
        percentage: Math.round((results.length / chunks.length) * 100)
      })
    }

    // Small delay between batches to avoid rate limits
    if (i + batchSize < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return results
}

/**
 * Main function to generate embeddings for all chunks
 */
async function generateEmbeddings(chunksData, options = {}) {
  const {
    provider = 'huggingface',
    model = 'ibm-granite', // Default: IBM Granite multilingual
    batchSize = 100,
    retries = 3,
    onProgress = null
  } = options

  const modelConfig = JAPANESE_MODELS[model]
  if (!modelConfig) {
    throw new Error(`Unknown model: ${model}. Available: ${Object.keys(JAPANESE_MODELS).join(', ')}`)
  }

  console.log(`\n🔄 Generating embeddings for ${chunksData.chunks.length} chunks...`)
  console.log(`   Provider: ${provider}`)
  console.log(`   Model: ${modelConfig.name}`)
  console.log(`   Dimensions: ${modelConfig.dimensions}`)
  console.log(`   Description: ${modelConfig.description}`)

  const startTime = Date.now()

  // Process all chunks
  const enrichedChunks = await processBatch(chunksData.chunks, {
    provider,
    model,
    batchSize,
    onProgress
  })

  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000

  // Calculate statistics
  const stats = {
    provider,
    model: modelConfig.name,
    modelAlias: model,
    totalChunks: enrichedChunks.length,
    totalDimensions: enrichedChunks[0]?.embedding?.length || 0,
    processingTime: duration,
    avgTimePerChunk: duration / enrichedChunks.length,
    batchSize,
    estimatedCost: provider === 'openai' ? estimateCost(chunksData.chunks) : 0
  }

  console.log(`\n✅ Generated ${enrichedChunks.length} embeddings in ${duration.toFixed(2)}s`)
  console.log(`   Average: ${stats.avgTimePerChunk.toFixed(3)}s per chunk`)
  if (provider === 'openai') {
    console.log(`   Estimated cost: $${stats.estimatedCost.toFixed(4)}`)
  } else {
    console.log(`   Cost: FREE (HuggingFace)`)
  }

  return {
    chunks: enrichedChunks,
    stats
  }
}

/**
 * Estimate API cost (OpenAI only)
 * text-embedding-3-small: $0.02 / 1M tokens
 */
function estimateCost(chunks) {
  // Rough estimate: ~4 chars per token for Japanese
  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.content.length, 0)
  const estimatedTokens = totalChars / 4
  const costPerToken = 0.02 / 1000000
  return estimatedTokens * costPerToken
}

/**
 * Validate embeddings
 */
function validateEmbeddings(enrichedChunks, expectedDimensions = null) {
  const issues = []

  enrichedChunks.forEach((chunk, index) => {
    if (!chunk.embedding) {
      issues.push(`Chunk ${index} (${chunk.chunkId}): Missing embedding`)
    } else if (!Array.isArray(chunk.embedding)) {
      issues.push(`Chunk ${index} (${chunk.chunkId}): Embedding is not an array`)
    } else if (expectedDimensions && chunk.embedding.length !== expectedDimensions) {
      issues.push(`Chunk ${index} (${chunk.chunkId}): Wrong dimension (${chunk.embedding.length} instead of ${expectedDimensions})`)
    }
  })

  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * List available models
 */
function listModels() {
  console.log('\n📋 Available Embedding Models:\n')
  Object.entries(JAPANESE_MODELS).forEach(([alias, config]) => {
    console.log(`  ${alias}:`)
    console.log(`    Name: ${config.name}`)
    console.log(`    Dimensions: ${config.dimensions}`)
    console.log(`    Description: ${config.description}`)
    console.log()
  })
}

module.exports = {
  generateEmbeddings,
  generateEmbedding,
  generateBatchEmbeddings,
  prepareTextForEmbedding,
  validateEmbeddings,
  estimateCost,
  listModels,
  JAPANESE_MODELS
}
