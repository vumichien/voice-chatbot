const { OpenAI } = require('openai')
const { generateEmbedding } = require('./embeddings')

// Initialize OpenAI (optional - for advanced extraction)
const openai = process.env.OPENAI_API_KEY ? new OpenAI() : null

/**
 * Extended topic keywords with descriptions
 */
const TOPIC_KEYWORDS = [
  { keyword: '黄金率', description: 'Golden ratio, balance in life' },
  { keyword: '価値観', description: 'Values, beliefs, principles' },
  { keyword: '人間関係', description: 'Human relationships, connections' },
  { keyword: '信用', description: 'Trust, credibility' },
  { keyword: '誠実', description: 'Sincerity, honesty' },
  { keyword: '変える', description: 'Change, transformation' },
  { keyword: '距離', description: 'Distance, boundaries' },
  { keyword: '時間', description: 'Time, timing' },
  { keyword: '約束', description: 'Promise, commitment' },
  { keyword: 'お金', description: 'Money, financial matters' },
  { keyword: '仕事', description: 'Work, career' },
  { keyword: '人生', description: 'Life, life philosophy' },
  { keyword: '目標', description: 'Goals, objectives' },
  { keyword: '成功', description: 'Success, achievement' },
  { keyword: '幸せ', description: 'Happiness, joy' },
  { keyword: '責任', description: 'Responsibility, duty' },
  { keyword: '努力', description: 'Effort, hard work' },
  { keyword: '成長', description: 'Growth, development' },
  { keyword: '挑戦', description: 'Challenge, taking on challenges' },
  { keyword: '感謝', description: 'Gratitude, appreciation' },
  { keyword: '向上心', description: 'Ambition, desire to improve' },
  { keyword: '目的', description: 'Purpose, aim' },
  { keyword: '生きがい', description: 'Reason for living, purpose in life' },
  { keyword: 'やりがい', description: 'Sense of fulfillment, worth doing' }
]

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) return 0

  return dotProduct / denominator
}

/**
 * Extract topics using embedding-based similarity
 */
async function extractTopicsWithEmbedding(paragraphs, options = {}) {
  const {
    maxCharsPerTopic = 2000, // Giới hạn số chars trong một topic
    similarityThreshold = 0.5, // Threshold để xác định paragraph thuộc topic nào
    embeddingProvider = 'huggingface',
    embeddingModel = 'ibm-granite'
  } = options

  console.log(`\n🔍 Extracting topics using embedding similarity...`)
  console.log(`   Max chars per topic: ${maxCharsPerTopic}`)
  console.log(`   Similarity threshold: ${similarityThreshold}`)

  // Generate embeddings for all keywords
  console.log(`   Generating embeddings for ${TOPIC_KEYWORDS.length} topic keywords...`)
  const keywordEmbeddings = {}
  for (const topic of TOPIC_KEYWORDS) {
    try {
      const embedding = await generateEmbedding(topic.keyword, {
        provider: embeddingProvider,
        model: embeddingModel
      })
      keywordEmbeddings[topic.keyword] = embedding
    } catch (error) {
      console.warn(`   ⚠️  Failed to generate embedding for "${topic.keyword}": ${error.message}`)
    }
  }

  const topics = []
  let currentTopic = {
    name: 'General',
    paragraphs: [],
    keywords: [],
    totalChars: 0
  }

  // Process each paragraph
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i]
    const paraText = para.cleanedText || para.fullText || ''
    const paraLength = paraText.length

    // Check if current topic would exceed max chars
    const wouldExceedLimit = currentTopic.totalChars + paraLength > maxCharsPerTopic

    if (wouldExceedLimit && currentTopic.paragraphs.length > 0) {
      // Save current topic and start new one
      topics.push({ ...currentTopic })
      currentTopic = {
        name: 'General',
        paragraphs: [],
        keywords: [],
        totalChars: 0
      }
    }

    // Generate embedding for paragraph
    let bestMatch = null
    let bestSimilarity = similarityThreshold // Start with threshold

    try {
      const paraEmbedding = await generateEmbedding(paraText.substring(0, 500), { // Limit para text for embedding
        provider: embeddingProvider,
        model: embeddingModel
      })

      // Find best matching topic keyword
      for (const [keyword, keywordEmbedding] of Object.entries(keywordEmbeddings)) {
        const similarity = cosineSimilarity(paraEmbedding, keywordEmbedding)
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity
          bestMatch = keyword
        }
      }
    } catch (error) {
      console.warn(`   ⚠️  Failed to generate embedding for paragraph ${i + 1}: ${error.message}`)
    }

    // Determine topic
    if (bestMatch) {
      // Check if we need to start a new topic
      if (currentTopic.name !== 'General' && currentTopic.name !== bestMatch) {
        // Topic changed, save current and start new
        if (currentTopic.paragraphs.length > 0) {
          topics.push({ ...currentTopic })
        }
        currentTopic = {
          name: bestMatch,
          paragraphs: [para],
          keywords: [bestMatch],
          totalChars: paraLength
        }
      } else {
        // Same topic, add to current
        currentTopic.name = bestMatch
        currentTopic.paragraphs.push(para)
        if (!currentTopic.keywords.includes(bestMatch)) {
          currentTopic.keywords.push(bestMatch)
        }
        currentTopic.totalChars += paraLength
      }
    } else {
      // No good match, add to current topic (or General)
      currentTopic.paragraphs.push(para)
      currentTopic.totalChars += paraLength
    }

    // Progress indicator
    if ((i + 1) % 10 === 0) {
      console.log(`   Processed ${i + 1}/${paragraphs.length} paragraphs...`)
    }
  }

  // Add last topic
  if (currentTopic.paragraphs.length > 0) {
    topics.push(currentTopic)
  }

  console.log(`✓ Extracted ${topics.length} topics`)
  topics.forEach((topic, idx) => {
    console.log(`   Topic ${idx + 1}: "${topic.name}" (${topic.paragraphs.length} paragraphs, ${topic.totalChars} chars)`)
  })

  return topics
}

/**
 * Extract topics using basic keyword matching (fallback)
 */
function extractTopics(paragraphs) {
  const topicIndicators = TOPIC_KEYWORDS.map(t => t.keyword)

  const topics = []
  let currentTopic = {
    name: 'General',
    paragraphs: [],
    keywords: [],
    totalChars: 0
  }

  paragraphs.forEach((para, idx) => {
    const paraText = para.cleanedText || para.fullText || ''
    const paraLength = paraText.length

    // Simple keyword-based topic detection
    const foundKeywords = topicIndicators.filter(keyword =>
      paraText.includes(keyword)
    )

    if (foundKeywords.length > 0) {
      if (currentTopic.paragraphs.length > 0) {
        topics.push({ ...currentTopic })
      }

      currentTopic = {
        name: foundKeywords[0],
        paragraphs: [para],
        keywords: foundKeywords,
        totalChars: paraLength
      }
    } else {
      currentTopic.paragraphs.push(para)
      currentTopic.totalChars += paraLength
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
 * Enhance knowledge object using OpenAI
 */
async function enhanceKnowledgeWithAI(knowledge, retries = 3) {
  if (!openai) {
    throw new Error('OpenAI client not initialized')
  }

  const prompt = `以下の日本語のテキストから知識を抽出し、JSON形式で返してください。

テキスト:
${knowledge.content.context}

現在の抽出結果:
- トピック: ${knowledge.topic}
- タイプ: ${knowledge.type}
- 重要度: ${knowledge.metadata.importance}

以下の情報を改善してください:
1. より良い要約（main）を200文字以内で作成
2. 最も重要な要点（keyTakeaway）を100文字以内で抽出
3. カテゴリを分類: life_philosophy, business, relationship, personal_growth, other
4. 感情を分析: positive, neutral, negative
5. テーマ（themes）を3-5個のキーワードで抽出

JSON形式で返してください:
{
  "summary": "改善された要約",
  "keyTakeaway": "最も重要な要点",
  "category": "life_philosophy",
  "sentiment": "positive",
  "themes": ["テーマ1", "テーマ2", "テーマ3"]
}`

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use cheaper model for cost efficiency
        messages: [
          {
            role: 'system',
            content: 'あなたは日本語のテキストから知識を抽出する専門家です。JSON形式で正確に返答してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      const enhanced = JSON.parse(content)

      // Update knowledge object with enhanced data
      if (enhanced.summary) {
        knowledge.content.main = enhanced.summary
      }
      if (enhanced.keyTakeaway) {
        knowledge.content.keyTakeaway = enhanced.keyTakeaway
      }
      if (enhanced.category) {
        knowledge.metadata.category = enhanced.category
      }
      if (enhanced.sentiment) {
        knowledge.metadata.sentiment = enhanced.sentiment
      }
      if (enhanced.themes && Array.isArray(enhanced.themes)) {
        knowledge.metadata.themes = enhanced.themes
      }

      knowledge.metadata.aiEnhanced = true
      return knowledge

    } catch (error) {
      if (attempt === retries) {
        console.warn(`   ⚠️  Failed to enhance knowledge ${knowledge.knowledgeId} with AI: ${error.message}`)
        return knowledge // Return original if enhancement fails
      }

      const delay = Math.pow(2, attempt) * 1000
      console.log(`   Retry ${attempt}/${retries} after ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return knowledge
}

/**
 * Main extraction function
 */
async function extractKnowledge(cleanedResult, options = {}) {
  const {
    useAI = false, // Use OpenAI for advanced extraction
    generateQA = false,
    useEmbeddingForTopics = true, // Use embedding-based topic detection
    maxCharsPerTopic = 2000, // Max chars per topic
    similarityThreshold = 0.5, // Similarity threshold for topic matching
    embeddingProvider = 'huggingface',
    embeddingModel = 'ibm-granite'
  } = options

  const { cleanedParagraphs } = cleanedResult
  const knowledgeObjects = []
  let knowledgeId = 1

  // Group by topics first
  let topics
  if (useEmbeddingForTopics) {
    topics = await extractTopicsWithEmbedding(cleanedParagraphs, {
      maxCharsPerTopic,
      similarityThreshold,
      embeddingProvider,
      embeddingModel
    })
  } else {
    topics = extractTopics(cleanedParagraphs)
    console.log(`Identified ${topics.length} topics from ${cleanedParagraphs.length} paragraphs`)
  }

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
    console.log('🤖 Enhancing knowledge extraction with OpenAI...')
    let enhancedCount = 0

    // Enhance each knowledge object
    for (let i = 0; i < knowledgeObjects.length; i++) {
      const knowledge = knowledgeObjects[i]
      try {
        await enhanceKnowledgeWithAI(knowledge)
        enhancedCount++
        if ((i + 1) % 5 === 0) {
          console.log(`   Enhanced ${i + 1}/${knowledgeObjects.length} knowledge objects...`)
        }
      } catch (error) {
        console.warn(`   ⚠️  Failed to enhance knowledge ${knowledge.knowledgeId}: ${error.message}`)
      }

      // Small delay to avoid rate limits
      if (i < knowledgeObjects.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    console.log(`✓ Enhanced ${enhancedCount}/${knowledgeObjects.length} knowledge objects with AI`)
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
  extractTopicsWithEmbedding,
  classifyKnowledgeType,
  assessImportance,
  cosineSimilarity,
  TOPIC_KEYWORDS
}
