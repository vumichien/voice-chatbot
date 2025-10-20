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

  // Get embedding dimension from the data
  const dimension = embeddingsData.stats.totalDimensions

  // Prepare vectors
  const vectors = embeddingsData.chunks.map(chunk =>
    prepareVector(chunk, transcriptFile)
  )

  // Upload based on provider
  if (provider === 'pinecone') {
    const pinecone = initPinecone()
    const index = await ensurePineconeIndex(pinecone, indexName, dimension)
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

  // Build query options, only include filter if it has properties
  const queryOptions = {
    vector: queryVector,
    topK,
    includeMetadata
  }

  // Only add filter if it has keys
  if (filter && Object.keys(filter).length > 0) {
    queryOptions.filter = filter
  }

  const results = await index.namespace(namespace).query(queryOptions)

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
