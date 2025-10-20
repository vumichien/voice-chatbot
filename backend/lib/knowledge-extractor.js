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
      para.cleanedText.includes(keyword)
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
    /青木(?:さん)?/g,
    /野中(?:郁次郎)?(?:先生)?/g,
    /竹沢(?:さん)?/g,
    /松下(?:之助)?/g
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
async function extractKnowledge(cleanedResult, options = {}) {
  const {
    useAI = false, // Use OpenAI for advanced extraction
    generateQA = false
  } = options

  const { cleanedParagraphs } = cleanedResult
  const knowledgeObjects = []
  let knowledgeId = 1

  // Group by topics first
  const topics = extractTopics(cleanedParagraphs)

  console.log(`Identified ${topics.length} topics from ${cleanedParagraphs.length} paragraphs`)

  for (const topic of topics) {
    // Combine topic paragraphs
    const topicText = topic.paragraphs.map(p => p.cleanedText).join(' ')

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

  console.log(`Extracted ${knowledgeObjects.length} knowledge objects`)
  console.log(`  High importance: ${knowledgeObjects.filter(k => k.metadata.importance === 'high').length}`)
  console.log(`  Medium importance: ${knowledgeObjects.filter(k => k.metadata.importance === 'medium').length}`)
  console.log(`  Low importance: ${knowledgeObjects.filter(k => k.metadata.importance === 'low').length}`)

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
