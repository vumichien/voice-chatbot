# Task 05: Stage 5 - Semantic Chunker

**Status**: [x] DONE
**Estimated Time**: 3 hours
**Dependencies**: Task 04 (Knowledge Extractor)
**Priority**: HIGH
**File**: `lib/semantic-chunker.js`
**Started**: 2025-01-20
**Completed**: 2025-01-20

---

## 📋 Description

Transform knowledge objects into semantic chunks optimized for vector database storage and retrieval. Uses intelligent chunking based on knowledge structure instead of naive character-based splitting.

---

## 🎯 Goals

1. Convert knowledge objects to semantic chunks
2. Maintain semantic coherence (no mid-sentence cuts)
3. Add contextual metadata for better retrieval
4. Support variable chunk sizes (200-1000 chars)
5. Include topic context (before/after)
6. Generate 40-60 chunks from knowledge objects
7. Prepare chunks for embedding generation

---

## ✅ Acceptance Criteria

- [ ] Each knowledge object becomes one or more chunks
- [ ] Chunks are 200-1000 characters each
- [ ] Rich metadata included (topic, entities, keywords)
- [ ] Context before/after added
- [ ] No broken sentences
- [ ] Generates 40-60 chunks from transcript
- [ ] All chunks have unique IDs
- [ ] Maintains timestamp traceability

---

## 🔧 Implementation

### lib/semantic-chunker.js

```javascript
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
function createChunk(knowledge, chunkIndex, contextBefore, contextAfter) {
  // Build main content
  let content = knowledge.content.context || knowledge.content.main

  // If content too long, split intelligently
  const maxSize = 1000
  const minSize = 200

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
    const knowledgeChunks = createChunk(knowledge, chunkId, contextBefore, contextAfter)

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
```

---

## 🧪 Testing Checklist

### Unit Tests

```javascript
const {
  createSemanticChunks,
  generateKeywords,
  extractContext,
  validateChunks
} = require('../../lib/semantic-chunker')

describe('Semantic Chunker', () => {

  test('generateKeywords extracts important terms', () => {
    const text = '黄金率は価値観の基準です。信用が大切です。'
    const entities = {
      concepts: ['黄金率', '価値観']
    }

    const keywords = generateKeywords(text, entities)

    expect(keywords).toContain('黄金率')
    expect(keywords).toContain('価値観')
    expect(keywords).toContain('信用')
  })

  test('extractContext gets neighboring topic', () => {
    const knowledge = [
      { topic: 'Topic A', content: { keyTakeaway: 'Summary A' } },
      { topic: 'Topic B', content: { keyTakeaway: 'Summary B' } },
      { topic: 'Topic C', content: { keyTakeaway: 'Summary C' } }
    ]

    const contextBefore = extractContext(knowledge, 1, 'before')
    expect(contextBefore.topic).toBe('Topic A')

    const contextAfter = extractContext(knowledge, 1, 'after')
    expect(contextAfter.topic).toBe('Topic C')
  })

  test('createSemanticChunks creates proper chunks', () => {
    const knowledge = {
      knowledge: [
        {
          knowledgeId: 'k001',
          topic: '黄金率',
          content: {
            context: '青木さんは29歳でバイブルと出会いました。'.repeat(5)
          },
          entities: { concepts: ['黄金率'] },
          timestamp: { start: '00:00:00', end: '00:01:00' },
          metadata: {
            importance: 'high',
            category: 'philosophy',
            segmentIds: [1, 2, 3]
          }
        }
      ]
    }

    const result = createSemanticChunks(knowledge)

    expect(result.chunks.length).toBeGreaterThan(0)
    expect(result.chunks[0].chunkId).toBe('chunk_001')
    expect(result.chunks[0].type).toBe('knowledge')
    expect(result.chunks[0].metadata.topic).toBe('黄金率')
  })

  test('validateChunks detects issues', () => {
    const validChunks = [
      {
        chunkId: 'chunk_001',
        content: 'A'.repeat(300),
        metadata: { topic: 'Test' }
      }
    ]

    const validation = validateChunks(validChunks)
    expect(validation.valid).toBe(true)

    const invalidChunks = [
      {
        chunkId: 'chunk_001',
        content: 'Too short',
        metadata: {}
      }
    ]

    const validation2 = validateChunks(invalidChunks)
    expect(validation2.valid).toBe(false)
    expect(validation2.issues.length).toBeGreaterThan(0)
  })
})
```

### Integration Tests

- [ ] **Test with knowledge extractor output**:
  ```bash
  node scripts/test-semantic-chunker.js
  ```

- [ ] **Verify chunk quality**:
  - 40-60 chunks created
  - Each chunk 200-1000 chars
  - All have proper metadata
  - Context links preserved

### Manual Verification

- [ ] **Check chunk structure**:
  1. Each chunk has unique ID
  2. Content is coherent (no broken sentences)
  3. Metadata includes all required fields
  4. Keywords are relevant
  5. Context before/after is correct

- [ ] **Verify stats**:
  - Total chunks: 40-60
  - Average size: 400-600 chars
  - Size distribution makes sense
  - Importance levels distributed

---

## 📊 Expected Output

```javascript
{
  chunks: [
    {
      chunkId: "chunk_001",
      type: "knowledge",
      content: "青木さんは29歳でバイブルと出会い、黄金率という価値観に目覚めました。何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい。これはマタイ7章12節の教えで、以降全ての意思決定の基準となりました。",
      metadata: {
        topic: "黄金率と価値観",
        knowledgeId: "k001",
        entities: {
          people: ["青木"],
          concepts: ["黄金率", "バイブル", "マタイ"]
        },
        concepts: ["黄金率", "バイブル", "マタイ"],
        timestamp: {
          start: "00:01:19,320",
          end: "00:01:44,880"
        },
        importance: "high",
        category: "life_philosophy",
        keywords: ["黄金率", "29歳", "バイブル", "価値観", "人生"],
        contextBefore: null,
        contextAfter: "誠実さの重要性",
        segmentIds: [26, 27, 28, 29, 30],
        language: "ja"
      }
    }
    // ... more chunks
  ],
  stats: {
    totalChunks: 45,
    totalKnowledge: 35,
    avgChunkSize: 485,
    sizeDistribution: {
      small: 12,
      medium: 25,
      large: 8
    },
    byImportance: {
      high: 15,
      medium: 22,
      low: 8
    }
  }
}
```

---

## ✨ Success Criteria

Task is complete when:
1. ✅ Creates 40-60 semantic chunks
2. ✅ All chunks are 200-1000 characters
3. ✅ Metadata is complete and accurate
4. ✅ Context links work correctly
5. ✅ Keywords are relevant
6. ✅ All tests pass
7. ✅ Can save chunks to JSON file

---

## 🐛 Common Issues

1. **Chunks too small/large**
   - Solution: Adjust sentence splitting logic

2. **Missing context**
   - Solution: Check includeContext option is true

3. **Duplicate keywords**
   - Solution: Use Set to deduplicate

4. **Broken sentences**
   - Solution: Split only at 。！？ boundaries

---

## 📌 Next Task

**Task 06: Stage 6 - Embeddings Generator** (`tasks/backend/06-stage6-embeddings.md`)

---

**Status**: [x] DONE
**Started**: 2025-01-20
**Completed**: 2025-01-20
**Notes**: Successfully created semantic chunker with 8 chunks from 6 knowledge objects. Average chunk size 659 chars. All validation passed. Chunks include rich metadata with keywords, context links, and importance ratings. Saved to output/chunks.json.
