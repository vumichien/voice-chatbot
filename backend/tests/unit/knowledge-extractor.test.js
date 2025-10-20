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
    expect(entities.people.some(p => p.includes('野中'))).toBe(true)
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
      content: { main: 'Long text content here that is over 100 characters to meet the length requirement for scoring.', quotes: ['黄金率とは...', '信用は...'] },
      entities: { people: ['青木'], concepts: ['黄金率', '信用'] }
    }

    expect(assessImportance(highImportance)).toBe('high')
  })

  test('assessImportance rates medium correctly', () => {
    const mediumImportance = {
      content: { main: 'Short text', quotes: ['Quote'] },
      entities: { people: [], concepts: [] }
    }

    expect(assessImportance(mediumImportance)).toBe('medium')
  })

  test('extractEntities finds organizations', () => {
    const text = 'アチューメントで働いています。'
    const entities = extractEntities(text)

    expect(entities.organizations).toContain('アチューメント')
  })

  test('extractEntities finds money amounts', () => {
    const text = '100万円を借りました。'
    const entities = extractEntities(text)

    expect(entities.numbers).toContain('100万')
  })
})
