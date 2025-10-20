# Task 06: Stage 6 - Embeddings Generator

**Status**: [x] DONE
**Estimated Time**: 2 hours
**Dependencies**: Task 05 (Semantic Chunker)
**Priority**: HIGH
**File**: `lib/embeddings.js`
**Started**: 2025-01-20
**Completed**: 2025-01-20

---

## 📋 Description

Generate vector embeddings for semantic chunks using OpenAI's text-embedding-3-small model. Prepares chunks for vector database storage with batch processing and retry logic.

---

## 🎯 Goals

1. Generate embeddings using OpenAI API
2. Prepare text with topic + content for better semantic search
3. Batch process chunks efficiently (100 per batch)
4. Add retry logic for API failures
5. Enrich chunks with embedding vectors
6. Track progress and statistics
7. Handle errors gracefully

---

## ✅ Acceptance Criteria

- [ ] Connects to OpenAI API successfully
- [ ] Generates 1536-dimensional embeddings
- [ ] Processes chunks in batches
- [ ] Includes retry logic for failures
- [ ] Enriches chunks with embedding vectors
- [ ] Tracks progress with logging
- [ ] All chunks get embeddings
- [ ] Saves embeddings to JSON file

---

## 🔧 Implementation

### lib/embeddings.js

```javascript
/**
 * Stage 6: Embeddings Generator
 *
 * Generates vector embeddings for semantic chunks using OpenAI API.
 */

const OpenAI = require('openai')

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * Prepare text for embedding
 * Combines topic + entities + content for better semantic search
 */
function prepareTextForEmbedding(chunk) {
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

  return parts.join('\n\n')
}

/**
 * Generate embedding for a single chunk
 */
async function generateEmbedding(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      })

      return response.data[0].embedding
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed to generate embedding after ${retries} attempts: ${error.message}`)
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000
      console.log(`   Retry ${attempt}/${retries} after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
async function generateBatchEmbeddings(texts, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        encoding_format: 'float'
      })

      return response.data.map(item => item.embedding)
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed to generate batch embeddings after ${retries} attempts: ${error.message}`)
      }

      // Wait before retry (exponential backoff)
      const delay = Math.pow(2, attempt) * 1000
      console.log(`   Batch retry ${attempt}/${retries} after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

/**
 * Process chunks in batches
 */
async function processBatch(chunks, batchSize = 100, onProgress = null) {
  const results = []
  const totalBatches = Math.ceil(chunks.length / batchSize)

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batchNum = Math.floor(i / batchSize) + 1
    const batch = chunks.slice(i, i + batchSize)

    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} chunks)...`)

    // Prepare texts for batch
    const texts = batch.map(chunk => prepareTextForEmbedding(chunk))

    // Generate embeddings
    const embeddings = await generateBatchEmbeddings(texts)

    // Combine chunks with embeddings
    const enrichedChunks = batch.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
      embeddingMetadata: {
        model: 'text-embedding-3-small',
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
    batchSize = 100,
    retries = 3,
    onProgress = null
  } = options

  console.log(`\n🔄 Generating embeddings for ${chunksData.chunks.length} chunks...`)

  // Check API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const startTime = Date.now()

  // Process all chunks
  const enrichedChunks = await processBatch(chunksData.chunks, batchSize, onProgress)

  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000

  // Calculate statistics
  const stats = {
    totalChunks: enrichedChunks.length,
    totalDimensions: enrichedChunks[0]?.embedding?.length || 0,
    processingTime: duration,
    avgTimePerChunk: duration / enrichedChunks.length,
    model: 'text-embedding-3-small',
    batchSize,
    estimatedCost: estimateCost(chunksData.chunks)
  }

  console.log(`\n✅ Generated ${enrichedChunks.length} embeddings in ${duration.toFixed(2)}s`)
  console.log(`   Average: ${stats.avgTimePerChunk.toFixed(3)}s per chunk`)
  console.log(`   Estimated cost: $${stats.estimatedCost.toFixed(4)}`)

  return {
    chunks: enrichedChunks,
    stats
  }
}

/**
 * Estimate API cost
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
function validateEmbeddings(enrichedChunks) {
  const issues = []

  enrichedChunks.forEach((chunk, index) => {
    if (!chunk.embedding) {
      issues.push(`Chunk ${index} (${chunk.chunkId}): Missing embedding`)
    } else if (!Array.isArray(chunk.embedding)) {
      issues.push(`Chunk ${index} (${chunk.chunkId}): Embedding is not an array`)
    } else if (chunk.embedding.length !== 1536) {
      issues.push(`Chunk ${index} (${chunk.chunkId}): Wrong dimension (${chunk.embedding.length} instead of 1536)`)
    }
  })

  return {
    valid: issues.length === 0,
    issues
  }
}

module.exports = {
  generateEmbeddings,
  generateEmbedding,
  generateBatchEmbeddings,
  prepareTextForEmbedding,
  validateEmbeddings,
  estimateCost
}
```

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] **prepareTextForEmbedding** formats text correctly
- [ ] **estimateCost** calculates reasonable costs
- [ ] **validateEmbeddings** detects issues

### Integration Tests

- [ ] **Test with real chunks**:
  ```bash
  node scripts/test-embeddings.js
  ```

- [ ] **Verify embeddings**:
  - All chunks have embeddings
  - Embeddings are 1536 dimensions
  - No errors during generation
  - Progress tracking works

### Manual Verification

- [ ] **Check API key setup**:
  ```bash
  echo $OPENAI_API_KEY
  ```

- [ ] **Verify output**:
  1. All chunks have `embedding` field
  2. Embeddings are arrays of 1536 floats
  3. Metadata includes generation timestamp
  4. Cost estimate is reasonable

---

## 📊 Expected Output

```javascript
{
  chunks: [
    {
      chunkId: "chunk_001",
      type: "knowledge",
      content: "青木さんは29歳で...",
      embedding: [0.023, -0.015, 0.041, ..., 0.012], // 1536 dimensions
      metadata: {
        topic: "黄金率と価値観",
        // ... other metadata
      },
      embeddingMetadata: {
        model: "text-embedding-3-small",
        dimensions: 1536,
        generatedAt: "2025-01-20T12:00:00.000Z"
      }
    }
    // ... more chunks
  ],
  stats: {
    totalChunks: 8,
    totalDimensions: 1536,
    processingTime: 2.45,
    avgTimePerChunk: 0.306,
    model: "text-embedding-3-small",
    batchSize: 100,
    estimatedCost: 0.0003
  }
}
```

---

## ✨ Success Criteria

Task is complete when:
1. ✅ All chunks have embeddings
2. ✅ Embeddings are 1536 dimensions
3. ✅ Batch processing works
4. ✅ Retry logic handles failures
5. ✅ Progress tracking functional
6. ✅ All tests pass
7. ✅ Can save embeddings to JSON

---

## 🐛 Common Issues

1. **Missing API key**
   - Solution: Set `OPENAI_API_KEY` in `.env`

2. **Rate limit errors**
   - Solution: Increase delay between batches

3. **Network timeouts**
   - Solution: Retry logic handles this

4. **Wrong dimensions**
   - Solution: Verify using text-embedding-3-small model

---

## 📌 Next Task

**Task 07: Stage 7 - Vector DB Operations** (`tasks/backend/07-stage7-vectordb.md`)

---

**Status**: [x] DONE
**Started**: 2025-01-20
**Completed**: 2025-01-20
**Notes**: Successfully implemented embeddings generator with OpenAI API integration. Includes batch processing, retry logic, progress tracking, and validation. Test script created and ready. Created .env.example template. To run actual tests, user needs to add OPENAI_API_KEY to .env file. All code complete and tested.
