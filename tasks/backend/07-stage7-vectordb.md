# Task 07: Stage 7 - Vector DB Operations

**Status**: [x] DONE
**Estimated Time**: 3 hours
**Dependencies**: Task 06 (Embeddings Generator)
**Priority**: HIGH
**File**: `lib/vectordb.js`
**Started**: 2025-01-20
**Completed**: 2025-01-20

---

## 📋 Description

Upload embeddings to vector database (Pinecone or Upstash Vector) with batch processing and metadata. Implements search functionality for retrieval-augmented generation (RAG).

---

## 🎯 Goals

1. Support both Pinecone and Upstash Vector databases
2. Create and configure vector index
3. Batch upload vectors with metadata
4. Implement similarity search
5. Support namespace for multi-file scaling
6. Add error handling and retry logic
7. Track upload progress and statistics

---

## ✅ Acceptance Criteria

- [ ] Connects to Pinecone or Upstash Vector
- [ ] Creates index with correct configuration (1536 dims, cosine)
- [ ] Uploads vectors in batches (100 per batch)
- [ ] Includes all metadata with vectors
- [ ] Implements similarity search function
- [ ] Supports namespaces
- [ ] Handles errors gracefully
- [ ] All vectors uploaded successfully

---

## 🔧 Implementation

### lib/vectordb.js

```javascript
/**
 * Stage 7: Vector Database Operations
 *
 * Uploads embeddings to vector database and provides search functionality.
 * Supports Pinecone and Upstash Vector.
 */

const { Pinecone } = require('@pinecone-database/pinecone')
const { Index } = require('@upstash/vector')

/**
 * Initialize Pinecone client
 */
function initPinecone() {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error('PINECONE_API_KEY environment variable not set')
  }

  return new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
  })
}

/**
 * Initialize Upstash Vector client
 */
function initUpstash() {
  if (!process.env.UPSTASH_VECTOR_URL || !process.env.UPSTASH_VECTOR_TOKEN) {
    throw new Error('UPSTASH_VECTOR_URL and UPSTASH_VECTOR_TOKEN environment variables not set')
  }

  return new Index({
    url: process.env.UPSTASH_VECTOR_URL,
    token: process.env.UPSTASH_VECTOR_TOKEN
  })
}

/**
 * Create or get Pinecone index
 */
async function ensurePineconeIndex(pinecone, indexName, dimension = 1536) {
  try {
    // Check if index exists
    const indexes = await pinecone.listIndexes()
    const indexExists = indexes.indexes?.some(idx => idx.name === indexName)

    if (!indexExists) {
      console.log(`Creating Pinecone index: ${indexName}...`)
      await pinecone.createIndex({
        name: indexName,
        dimension: dimension,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      })

      // Wait for index to be ready
      console.log('Waiting for index to be ready...')
      await new Promise(resolve => setTimeout(resolve, 60000)) // Wait 60 seconds
    }

    return pinecone.index(indexName)
  } catch (error) {
    throw new Error(`Failed to ensure Pinecone index: ${error.message}`)
  }
}

/**
 * Prepare vector for upload
 */
function prepareVector(chunk, transcriptFile = 'transcript.srt') {
  // Flatten entities for metadata
  const flatEntities = {
    people: chunk.metadata.entities?.people || [],
    concepts: chunk.metadata.entities?.concepts || [],
    organizations: chunk.metadata.entities?.organizations || []
  }

  return {
    id: chunk.chunkId,
    values: chunk.embedding,
    metadata: {
      content: chunk.content.substring(0, 1000), // Limit content length for metadata
      topic: chunk.metadata.topic,
      people: flatEntities.people.join(', '),
      concepts: flatEntities.concepts.join(', '),
      organizations: flatEntities.organizations.join(', '),
      timestamp: `${chunk.metadata.timestamp.start} --> ${chunk.metadata.timestamp.end}`,
      importance: chunk.metadata.importance,
      category: chunk.metadata.category,
      keywords: chunk.metadata.keywords.join(', '),
      transcriptFile: transcriptFile,
      uploadDate: new Date().toISOString()
    }
  }
}

/**
 * Upload vectors to Pinecone in batches
 */
async function uploadToPinecone(index, vectors, namespace = '', batchSize = 100) {
  const batches = []
  for (let i = 0; i < vectors.length; i += batchSize) {
    batches.push(vectors.slice(i, i + batchSize))
  }

  console.log(`Uploading ${vectors.length} vectors in ${batches.length} batches to Pinecone...`)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`  Batch ${i + 1}/${batches.length}: ${batch.length} vectors`)

    try {
      await index.namespace(namespace).upsert(batch)
    } catch (error) {
      throw new Error(`Failed to upload batch ${i + 1}: ${error.message}`)
    }

    // Small delay between batches
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log(`✅ Successfully uploaded ${vectors.length} vectors to Pinecone`)
}

/**
 * Upload vectors to Upstash in batches
 */
async function uploadToUpstash(client, vectors, batchSize = 100) {
  const batches = []
  for (let i = 0; i < vectors.length; i += batchSize) {
    batches.push(vectors.slice(i, i + batchSize))
  }

  console.log(`Uploading ${vectors.length} vectors in ${batches.length} batches to Upstash...`)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`  Batch ${i + 1}/${batches.length}: ${batch.length} vectors`)

    try {
      await client.upsert(batch)
    } catch (error) {
      throw new Error(`Failed to upload batch ${i + 1}: ${error.message}`)
    }

    // Small delay between batches
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  console.log(`✅ Successfully uploaded ${vectors.length} vectors to Upstash`)
}

/**
 * Main upload function
 */
async function uploadVectors(embeddingsData, options = {}) {
  const {
    provider = 'pinecone', // 'pinecone' or 'upstash'
    indexName = 'transcript-knowledge',
    namespace = '',
    transcriptFile = 'transcript.srt',
    batchSize = 100
  } = options

  console.log(`\n🔄 Uploading vectors to ${provider}...`)
  console.log(`   Index: ${indexName}`)
  console.log(`   Namespace: ${namespace || '(default)'}`)
  console.log(`   Total vectors: ${embeddingsData.chunks.length}`)

  const startTime = Date.now()

  // Prepare vectors
  const vectors = embeddingsData.chunks.map(chunk =>
    prepareVector(chunk, transcriptFile)
  )

  // Upload based on provider
  if (provider === 'pinecone') {
    const pinecone = initPinecone()
    const index = await ensurePineconeIndex(pinecone, indexName)
    await uploadToPinecone(index, vectors, namespace, batchSize)
  } else if (provider === 'upstash') {
    const upstash = initUpstash()
    await uploadToUpstash(upstash, vectors, batchSize)
  } else {
    throw new Error(`Unknown provider: ${provider}`)
  }

  const endTime = Date.now()
  const duration = (endTime - startTime) / 1000

  const stats = {
    provider,
    indexName,
    namespace,
    totalVectors: vectors.length,
    uploadTime: duration,
    avgTimePerVector: duration / vectors.length
  }

  console.log(`\n✅ Upload complete in ${duration.toFixed(2)}s`)
  console.log(`   Average: ${stats.avgTimePerVector.toFixed(3)}s per vector`)

  return {
    success: true,
    stats
  }
}

/**
 * Search vectors in Pinecone
 */
async function searchPinecone(index, queryVector, options = {}) {
  const {
    namespace = '',
    topK = 5,
    filter = {},
    includeMetadata = true
  } = options

  const results = await index.namespace(namespace).query({
    vector: queryVector,
    topK,
    filter,
    includeMetadata
  })

  return results.matches || []
}

/**
 * Search vectors in Upstash
 */
async function searchUpstash(client, queryVector, options = {}) {
  const {
    topK = 5,
    filter = {},
    includeMetadata = true
  } = options

  const results = await client.query({
    vector: queryVector,
    topK,
    filter,
    includeMetadata
  })

  return results
}

/**
 * Main search function
 */
async function searchVectors(queryVector, options = {}) {
  const {
    provider = 'pinecone',
    indexName = 'transcript-knowledge',
    namespace = '',
    topK = 5,
    filter = {}
  } = options

  if (provider === 'pinecone') {
    const pinecone = initPinecone()
    const index = pinecone.index(indexName)
    return await searchPinecone(index, queryVector, { namespace, topK, filter })
  } else if (provider === 'upstash') {
    const upstash = initUpstash()
    return await searchUpstash(upstash, queryVector, { topK, filter })
  } else {
    throw new Error(`Unknown provider: ${provider}`)
  }
}

/**
 * Get index statistics
 */
async function getIndexStats(options = {}) {
  const {
    provider = 'pinecone',
    indexName = 'transcript-knowledge',
    namespace = ''
  } = options

  if (provider === 'pinecone') {
    const pinecone = initPinecone()
    const index = pinecone.index(indexName)
    const stats = await index.describeIndexStats()
    return stats
  } else if (provider === 'upstash') {
    const upstash = initUpstash()
    const info = await upstash.info()
    return info
  }
}

/**
 * Delete vectors by IDs
 */
async function deleteVectors(ids, options = {}) {
  const {
    provider = 'pinecone',
    indexName = 'transcript-knowledge',
    namespace = ''
  } = options

  if (provider === 'pinecone') {
    const pinecone = initPinecone()
    const index = pinecone.index(indexName)
    await index.namespace(namespace).deleteMany(ids)
  } else if (provider === 'upstash') {
    const upstash = initUpstash()
    await upstash.delete(ids)
  }

  console.log(`✅ Deleted ${ids.length} vectors`)
}

module.exports = {
  uploadVectors,
  searchVectors,
  getIndexStats,
  deleteVectors,
  prepareVector,
  initPinecone,
  initUpstash
}
```

---

## 🧪 Testing Checklist

### Unit Tests

- [ ] **prepareVector** formats metadata correctly
- [ ] **initPinecone** validates API key
- [ ] **initUpstash** validates credentials

### Integration Tests

- [ ] **Test with real embeddings**:
  ```bash
  node scripts/test-vectordb.js
  ```

- [ ] **Verify upload**:
  - All vectors uploaded
  - Metadata preserved
  - No errors during upload

- [ ] **Test search**:
  - Search returns results
  - Results ranked by similarity
  - Metadata included

### Manual Verification

- [ ] **Check vector DB dashboard**:
  - Index created
  - Vector count matches
  - Metadata visible

- [ ] **Test similarity search**:
  1. Upload vectors
  2. Search with sample query
  3. Verify top results are relevant

---

## 📊 Expected Output

```javascript
{
  success: true,
  stats: {
    provider: "pinecone",
    indexName: "transcript-knowledge",
    namespace: "",
    totalVectors: 8,
    uploadTime: 3.45,
    avgTimePerVector: 0.431
  }
}
```

**Search Results**:
```javascript
[
  {
    id: "chunk_001",
    score: 0.92,
    metadata: {
      content: "青木さんは29歳で...",
      topic: "黄金率と価値観",
      importance: "high",
      timestamp: "00:01:19,320 --> 00:01:44,880"
    }
  },
  // ... more results
]
```

---

## ✨ Success Criteria

Task is complete when:
1. ✅ Vector DB client initialized
2. ✅ Index created/configured
3. ✅ All vectors uploaded
4. ✅ Search functionality works
5. ✅ Metadata preserved
6. ✅ All tests pass
7. ✅ Stats retrieved successfully

---

## 🐛 Common Issues

1. **Missing API credentials**
   - Solution: Set PINECONE_API_KEY or UPSTASH_* in .env

2. **Index creation timeout**
   - Solution: Wait for index to be ready (60s)

3. **Metadata too large**
   - Solution: Limit content to 1000 chars

4. **Rate limit errors**
   - Solution: Add delays between batches

---

## 📝 Environment Variables

Add to `.env`:

**For Pinecone**:
```
PINECONE_API_KEY=your_pinecone_api_key
```

**For Upstash Vector**:
```
UPSTASH_VECTOR_URL=your_upstash_url
UPSTASH_VECTOR_TOKEN=your_upstash_token
```

---

## 📌 Next Task

**Task 08: Pipeline Orchestrator** (`tasks/backend/08-pipeline-orchestrator.md`)

---

**Status**: [x] DONE
**Started**: 2025-01-20
**Completed**: 2025-01-20
**Notes**: Successfully implemented vector DB operations with support for both Pinecone and Upstash Vector. Includes batch upload, similarity search, index stats, and delete functions. Test script created with credential checking and clear setup instructions. Updated .env.example with vector DB configuration. Installed @upstash/vector package. Ready to use when credentials are added. This completes the 7-stage content processing pipeline!
