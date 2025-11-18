/**
 * Stage 5: Semantic Chunker
 *
 * Converts knowledge objects into semantic chunks optimized for vector DB.
 * Uses knowledge-based chunking instead of character-based chunking.
 */

/**
 * Generate keywords from text
 */
function generateKeywords(text, entities = {}) {
  const keywords = new Set()

  // Add entity-based keywords
  if (entities.people) keywords.add(...entities.people)
  if (entities.concepts) keywords.add(...entities.concepts)
  if (entities.organizations) keywords.add(...entities.organizations)

  // Extract important nouns from text (simple approach)
  const importantTerms = [
    '黄金率', '価値観', '人間関係', '信用', '誠実',
    '時間', '約束', 'お金', '友人', '社員', '経営',
    '人生', '仕事', '成功', '豊か', '責任'
  ]

  importantTerms.forEach(term => {
    if (text.includes(term)) {
      keywords.add(term)
    }
  })

  return Array.from(keywords)
}

/**
 * Extract context summary from neighboring knowledge
 */
function extractContext(knowledgeObjects, currentIndex, direction = 'before') {
  const neighborIndex = direction === 'before' ? currentIndex - 1 : currentIndex + 1

  if (neighborIndex < 0 || neighborIndex >= knowledgeObjects.length) {
    return null
  }

  const neighbor = knowledgeObjects[neighborIndex]

  // Return brief summary of neighboring topic
  return {
    topic: neighbor.topic,
    summary: neighbor.content.keyTakeaway || neighbor.content.main.substring(0, 50) + '...'
  }
}

/**
 * Create chunk from knowledge object
 */
function createChunk(knowledge, chunkIndex, contextBefore, contextAfter, options = {}) {
  // Build main content
  let content = knowledge.content.context || knowledge.content.main

  // Use options from config instead of hardcoded values
  const maxSize = options.maxChunkSize || 1000
  const minSize = options.minChunkSize || 200

  if (content.length > maxSize) {
    // Split at sentence boundary
    const sentences = content.match(/[^。！？]+[。！？]/g) || [content]
    let accumulated = ''
    const chunks = []

    for (const sentence of sentences) {
      if ((accumulated + sentence).length > maxSize && accumulated.length >= minSize) {
        chunks.push(accumulated)
        accumulated = sentence
      } else {
        accumulated += sentence
      }
    }

    if (accumulated.length > 0) {
      chunks.push(accumulated)
    }

    return chunks.map((chunk, idx) => ({
      chunkId: `chunk_${String(chunkIndex).padStart(3, '0')}_${idx}`,
      type: 'knowledge',
      content: chunk,
      metadata: {
        topic: knowledge.topic,
        knowledgeId: knowledge.knowledgeId,
        entities: knowledge.entities,
        concepts: knowledge.entities.concepts || [],
        timestamp: knowledge.timestamp,
        importance: knowledge.metadata.importance,
        category: knowledge.metadata.category,
        keywords: generateKeywords(chunk, knowledge.entities),
        contextBefore: contextBefore ? contextBefore.topic : null,
        contextAfter: contextAfter ? contextAfter.topic : null,
        segmentIds: knowledge.metadata.segmentIds,
        language: 'ja',
        partIndex: idx,
        totalParts: chunks.length
      }
    }))
  }

  // Single chunk
  return [{
    chunkId: `chunk_${String(chunkIndex).padStart(3, '0')}`,
    type: 'knowledge',
    content,
    metadata: {
      topic: knowledge.topic,
      knowledgeId: knowledge.knowledgeId,
      entities: knowledge.entities,
      concepts: knowledge.entities.concepts || [],
      timestamp: knowledge.timestamp,
      importance: knowledge.metadata.importance,
      category: knowledge.metadata.category,
      keywords: generateKeywords(content, knowledge.entities),
      contextBefore: contextBefore ? contextBefore.topic : null,
      contextAfter: contextAfter ? contextAfter.topic : null,
      segmentIds: knowledge.metadata.segmentIds,
      language: 'ja'
    }
  }]
}

/**
 * Main chunking function
 */
function createSemanticChunks(knowledgeData, options = {}) {
  const {
    minChunkSize = 200,
    maxChunkSize = 1000,
    includeContext = true
  } = options

  const knowledgeObjects = knowledgeData.knowledge || knowledgeData
  const chunks = []
  let chunkId = 1

  knowledgeObjects.forEach((knowledge, index) => {
    // Get context from neighboring knowledge
    const contextBefore = includeContext ? extractContext(knowledgeObjects, index, 'before') : null
    const contextAfter = includeContext ? extractContext(knowledgeObjects, index, 'after') : null

    // Create chunk(s) from knowledge
    const knowledgeChunks = createChunk(knowledge, chunkId, contextBefore, contextAfter, {
      maxChunkSize,
      minChunkSize
    })

    chunks.push(...knowledgeChunks)
    chunkId += knowledgeChunks.length
  })

  return {
    chunks,
    stats: {
      totalChunks: chunks.length,
      totalKnowledge: knowledgeObjects.length,
      avgChunkSize: Math.round(chunks.reduce((sum, c) => sum + c.content.length, 0) / chunks.length),
      sizeDistribution: {
        small: chunks.filter(c => c.content.length < 400).length,
        medium: chunks.filter(c => c.content.length >= 400 && c.content.length < 700).length,
        large: chunks.filter(c => c.content.length >= 700).length
      },
      byImportance: {
        high: chunks.filter(c => c.metadata.importance === 'high').length,
        medium: chunks.filter(c => c.metadata.importance === 'medium').length,
        low: chunks.filter(c => c.metadata.importance === 'low').length
      }
    }
  }
}

/**
 * Validate chunks
 */
function validateChunks(chunks) {
  const issues = []

  chunks.forEach((chunk, index) => {
    // Check size
    if (chunk.content.length < 100) {
      issues.push(`Chunk ${index}: Too small (${chunk.content.length} chars)`)
    }
    if (chunk.content.length > 1200) {
      issues.push(`Chunk ${index}: Too large (${chunk.content.length} chars)`)
    }

    // Check required fields
    if (!chunk.chunkId) {
      issues.push(`Chunk ${index}: Missing chunkId`)
    }
    if (!chunk.metadata) {
      issues.push(`Chunk ${index}: Missing metadata`)
    }
    if (!chunk.metadata.topic) {
      issues.push(`Chunk ${index}: Missing topic`)
    }
  })

  return {
    valid: issues.length === 0,
    issues
  }
}

module.exports = {
  createSemanticChunks,
  createChunk,
  generateKeywords,
  extractContext,
  validateChunks
}
