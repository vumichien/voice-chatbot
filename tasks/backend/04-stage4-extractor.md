# Task 04: Stage 4 - Knowledge Extractor

**Status**: [ ] TODO
**Estimated Time**: 6 hours
**Dependencies**: Task 03 (Cleaner)
**Priority**: CRITICAL
**File**: `lib/knowledge-extractor.js`

---

## 📋 Description

**MOST IMPORTANT STAGE**: Transform cleaned paragraphs into structured knowledge objects with semantic meaning. This extracts topics, entities, key concepts, quotes, and creates meaningful knowledge chunks for the chatbot.

---

## 🎯 Goals

1. Segment paragraphs by topics
2. Extract named entities (people, places, concepts)
3. Identify and extract key quotes
4. Extract facts, insights, and principles
5. Classify knowledge type (advice, principle, story, etc.)
6. Assign importance levels
7. Optional: Auto-generate Q&A pairs

---

## ✅ Acceptance Criteria

- [ ] Identifies distinct topics in transcript
- [ ] Extracts entities: people, concepts, ages, references
- [ ] Preserves important quotes verbatim
- [ ] Creates structured knowledge objects
- [ ] Assigns appropriate categories
- [ ] Links related knowledge objects
- [ ] Maintains timestamp traceability
- [ ] Extracts 30-50 knowledge objects from transcript

---

## 🔧 Implementation

### lib/knowledge-extractor.js

```javascript
const { OpenAI } = require('openai')

// Initialize OpenAI (optional - for advanced extraction)
const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null

/**
 * Extract topics using basic NLP
 */
function extractTopics(paragraphs) {
  // Keywords that indicate topic shifts
  const topicIndicators = [
    '黄金率', '価値観', '人間関係', '信用', '誠実',
    '変える', '距離', '時間', '約束', 'お金'
  ]

  const topics = []
  let currentTopic = {
    name: '',
    paragraphs: [],
    keywords: []
  }

  paragraphs.forEach((para, idx) => {
    // Simple keyword-based topic detection
    const foundKeywords = topicIndicators.filter(keyword =>
      para.fullText.includes(keyword)
    )

    if (foundKeywords.length > 0) {
      if (currentTopic.paragraphs.length > 0) {
        topics.push({ ...currentTopic })
      }

      currentTopic = {
        name: foundKeywords[0],
        paragraphs: [para],
        keywords: foundKeywords
      }
    } else {
      currentTopic.paragraphs.push(para)
    }
  })

  if (currentTopic.paragraphs.length > 0) {
    topics.push(currentTopic)
  }

  return topics
}

/**
 * Extract named entities from text
 */
function extractEntities(text) {
  const entities = {
    people: [],
    concepts: [],
    organizations: [],
    ages: [],
    numbers: []
  }

  // People patterns
  const peoplePatterns = [
    /青木[さん]?/g,
    /野中[郁次郎]?[先生]?/g,
    /竹沢[さん]?/g,
    /松下[之助]?/g
  ]

  peoplePatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      entities.people.push(...matches.filter(m => !entities.people.includes(m)))
    }
  })

  // Concepts
  const conceptPatterns = [
    '黄金率', 'バイブル', 'マタイ', '価値観', '信用',
    '誠実', 'クオリティワールド', '常時世界'
  ]

  conceptPatterns.forEach(concept => {
    if (text.includes(concept)) {
      entities.concepts.push(concept)
    }
  })

  // Organizations
  const orgPatterns = ['アチューメント', '東京会館', '一橋大学']
  orgPatterns.forEach(org => {
    if (text.includes(org)) {
      entities.organizations.push(org)
    }
  })

  // Ages
  const ageMatches = text.match(/(\d{1,2})歳/g)
  if (ageMatches) {
    entities.ages = ageMatches.map(m => parseInt(m))
  }

  // Numbers (money, counts)
  const numberMatches = text.match(/(\d+)万/g)
  if (numberMatches) {
    entities.numbers = numberMatches
  }

  return entities
}

/**
 * Extract important quotes (sentences with 「」or specific patterns)
 */
function extractQuotes(text) {
  const quotes = []

  // Quoted text
  const quotedMatches = text.match(/「([^」]+)」/g)
  if (quotedMatches) {
    quotes.push(...quotedMatches.map(q => q.replace(/[「」]/g, '')))
  }

  // Important statements (ending with です/ます/だ/よ etc)
  const importantPatterns = [
    /([^。]+ことが大切[^。]*。)/g,
    /([^。]+してはいけない[^。]*。)/g,
    /([^。]+べき[^。]*。)/g,
    /([^。]+なんです。)/g
  ]

  importantPatterns.forEach(pattern => {
    const matches = text.match(pattern)
    if (matches) {
      quotes.push(...matches)
    }
  })

  return [...new Set(quotes)] // Remove duplicates
}

/**
 * Determine knowledge type
 */
function classifyKnowledgeType(text) {
  if (text.includes('べき') || text.includes('した方がいい')) {
    return 'advice'
  }
  if (text.includes('原則') || text.includes('大切') || text.includes('重要')) {
    return 'principle'
  }
  if (text.includes('歳') || text.includes('時') || text.includes('経験')) {
    return 'biographical_event'
  }
  if (text.includes('例えば') || text.includes('ある時')) {
    return 'anecdote'
  }

  return 'general'
}

/**
 * Determine importance level
 */
function assessImportance(knowledgeObject) {
  let score = 0

  // Has quotes
  if (knowledgeObject.content.quotes && knowledgeObject.content.quotes.length > 0) {
    score += 2
  }

  // Named entities
  if (knowledgeObject.entities.people.length > 0) {
    score += 1
  }

  // Key concepts
  const keyConcepts = ['黄金率', '価値観', '信用', '人生']
  if (knowledgeObject.entities.concepts.some(c => keyConcepts.includes(c))) {
    score += 2
  }

  // Length (longer = more detailed)
  if (knowledgeObject.content.main.length > 100) {
    score += 1
  }

  if (score >= 4) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}

/**
 * Main extraction function
 */
async function extractKnowledge(paragraphs, options = {}) {
  const {
    useAI = false, // Use OpenAI for advanced extraction
    generateQA = false
  } = options

  const knowledgeObjects = []
  let knowledgeId = 1

  // Group by topics first
  const topics = extractTopics(paragraphs)

  for (const topic of topics) {
    // Combine topic paragraphs
    const topicText = topic.paragraphs.map(p => p.fullText).join(' ')

    // Extract components
    const entities = extractEntities(topicText)
    const quotes = extractQuotes(topicText)
    const type = classifyKnowledgeType(topicText)

    // Create knowledge object
    const knowledge = {
      knowledgeId: `k${String(knowledgeId).padStart(3, '0')}`,
      topic: topic.name || 'General',
      type,
      content: {
        main: topicText.substring(0, 200) + '...', // Summary
        context: topicText,
        quotes: quotes.slice(0, 3), // Top 3 quotes
        keyTakeaway: quotes[0] || topicText.substring(0, 100)
      },
      entities,
      timestamp: {
        start: topic.paragraphs[0].startTime,
        end: topic.paragraphs[topic.paragraphs.length - 1].endTime
      },
      metadata: {
        importance: 'medium', // Will be assessed
        category: 'life_philosophy',
        sentiment: 'neutral',
        themes: topic.keywords,
        segmentIds: topic.paragraphs.flatMap(p => p.segmentIds)
      }
    }

    // Assess importance
    knowledge.metadata.importance = assessImportance(knowledge)

    knowledgeObjects.push(knowledge)
    knowledgeId++
  }

  // Optional: Use AI for better extraction
  if (useAI && openai) {
    // Enhance with OpenAI (implementation optional)
    console.log('AI enhancement enabled - would use OpenAI API here')
  }

  return {
    knowledge: knowledgeObjects,
    stats: {
      totalKnowledgeObjects: knowledgeObjects.length,
      highImportance: knowledgeObjects.filter(k => k.metadata.importance === 'high').length,
      mediumImportance: knowledgeObjects.filter(k => k.metadata.importance === 'medium').length,
      lowImportance: knowledgeObjects.filter(k => k.metadata.importance === 'low').length,
      topics: topics.length
    }
  }
}

module.exports = {
  extractKnowledge,
  extractEntities,
  extractQuotes,
  extractTopics,
  classifyKnowledgeType,
  assessImportance
}
```

---

## 🧪 Testing Checklist

### Unit Tests

```javascript
const {
  extractEntities,
  extractQuotes,
  classifyKnowledgeType,
  assessImportance
} = require('../../lib/knowledge-extractor')

describe('Knowledge Extractor', () => {

  test('extractEntities finds people', () => {
    const text = '青木さんは野中郁次郎先生に会いました。'
    const entities = extractEntities(text)

    expect(entities.people).toContain('青木さん')
    expect(entities.people).toContain('野中')
  })

  test('extractEntities finds concepts', () => {
    const text = '黄金率とは価値観の基準です。'
    const entities = extractEntities(text)

    expect(entities.concepts).toContain('黄金率')
    expect(entities.concepts).toContain('価値観')
  })

  test('extractEntities finds ages', () => {
    const text = '29歳でバイブルと出会いました。'
    const entities = extractEntities(text)

    expect(entities.ages).toContain(29)
  })

  test('extractQuotes finds quoted text', () => {
    const text = '彼は「信用は大切です」と言いました。'
    const quotes = extractQuotes(text)

    expect(quotes).toContain('信用は大切です')
  })

  test('classifyKnowledgeType identifies advice', () => {
    const text = '人を変えようとするべきではありません。'
    expect(classifyKnowledgeType(text)).toBe('advice')
  })

  test('classifyKnowledgeType identifies biographical events', () => {
    const text = '29歳でバイブルと出会いました。'
    expect(classifyKnowledgeType(text)).toBe('biographical_event')
  })

  test('assessImportance rates correctly', () => {
    const highImportance = {
      content: { quotes: ['黄金率とは...', '信用は...'] },
      entities: { people: ['青木'], concepts: ['黄金率', '信用'] }
    }

    expect(assessImportance(highImportance)).toBe('high')
  })
})
```

### Integration Tests

- [ ] **Test with cleaned paragraphs**:
  ```bash
  node -e "
    const pipeline = require('./lib/content-pipeline')
    // Run stages 1-3, then extract knowledge
    // Verify 30-50 knowledge objects created
  "
  ```

- [ ] **Verify extraction quality**:
  - Check that 黄金率 knowledge is extracted
  - Verify quotes are preserved
  - Ensure entities are correct

### Manual Verification

- [ ] **Check key knowledge objects**:
  1. "黄金率との出会い" - should have:
     - Entities: 青木, バイブル, 黄金率, マタイ7章12節
     - Age: 29
     - Type: biographical_event
     - Importance: high
     - Quote: "何事でも人々から..."

  2. "価値観が合わない人との距離" - should have:
     - Concepts: 価値観, 距離, 人間関係
     - Type: advice
     - Importance: high
     - Quote: "価値観が合わない人とは..."

  3. "信用は無形の資本" - should have:
     - Concepts: 信用, 資本
     - Type: principle
     - Quote: "信用は無形の資本なんです"

---

## 📊 Expected Output

```javascript
{
  knowledge: [
    {
      knowledgeId: "k001",
      topic: "黄金率",
      type: "biographical_event",
      content: {
        main: "青木さんは29歳でバイブルと出会い...",
        context: "Full text...",
        quotes: [
          "何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい"
        ],
        keyTakeaway: "29歳での黄金率との出会いが人生を変えた"
      },
      entities: {
        people: ["青木"],
        concepts: ["黄金率", "バイブル", "マタイ"],
        ages: [29]
      },
      timestamp: {
        start: "00:01:19,320",
        end: "00:02:01,159"
      },
      metadata: {
        importance: "high",
        category: "life_philosophy",
        themes: ["黄金率", "価値観"],
        segmentIds: [26, 27, ...]
      }
    }
    // ... more knowledge objects
  ],
  stats: {
    totalKnowledgeObjects: 35,
    highImportance: 12,
    mediumImportance: 18,
    lowImportance: 5,
    topics: 8
  }
}
```

---

## ✨ Success Criteria

Task is complete when:
1. ✅ Extracts 30-50 knowledge objects
2. ✅ All key topics identified correctly
3. ✅ Entities extracted accurately
4. ✅ Important quotes preserved
5. ✅ Importance levels assigned reasonably
6. ✅ All tests pass
7. ✅ Can save knowledge to JSON file

---

## 📌 Next Task

**Task 05: Stage 5 - Semantic Chunker** (`tasks/backend/05-stage5-chunker.md`)

---

**Status**: [ ] TODO
**Started**: _____
**Completed**: _____
