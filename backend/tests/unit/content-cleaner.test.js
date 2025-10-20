const {
  cleanContent,
  normalizeCharacters,
  fixTranscriptionErrors,
  removeNonVerbalMarkers,
  standardizePunctuation
} = require('../../lib/content-cleaner')

describe('Content Cleaner', () => {

  test('normalizeCharacters converts full-width to half-width', () => {
    expect(normalizeCharacters('ＡＢＣ１２３')).toBe('ABC123')
    expect(normalizeCharacters('test　text')).toBe('test text')
  })

  test('fixTranscriptionErrors corrects known errors', () => {
    const result = fixTranscriptionErrors('青木サの話')
    expect(result.text).toBe('青木さんの話')
    expect(result.corrections).toHaveLength(1)
    expect(result.corrections[0].original).toBe('青木サ')
  })

  test('removeNonVerbalMarkers removes markers', () => {
    const text = 'これは[音楽]テストです[拍手]'
    expect(removeNonVerbalMarkers(text)).toBe('これはテストです')
  })

  test('standardizePunctuation fixes multiple punctuation', () => {
    expect(standardizePunctuation('本当に!!!')).toBe('本当に！')
    expect(standardizePunctuation('そうですか???')).toBe('そうですか？')
  })

  test('cleanContent processes paragraphs', async () => {
    const input = {
      paragraphs: [
        {
          paragraphId: 1,
          fullText: '青木サの[音楽]話です。。。',
          startTime: '00:00:00',
          endTime: '00:00:05'
        }
      ]
    }

    const result = await cleanContent(input, { fixErrors: true })

    expect(result.cleanedParagraphs).toHaveLength(1)
    expect(result.cleanedParagraphs[0].cleanedText).toBe('青木さんの話です…')
    expect(result.stats.totalCorrections).toBeGreaterThan(0)
  })

  test('preserves original text and metadata', async () => {
    const input = {
      paragraphs: [
        {
          paragraphId: 1,
          fullText: 'テスト',
          startTime: '00:00:00',
          endTime: '00:00:05',
          segmentIds: [1, 2, 3]
        }
      ]
    }

    const result = await cleanContent(input)

    expect(result.cleanedParagraphs[0].originalText).toBe('テスト')
    expect(result.cleanedParagraphs[0].startTime).toBe('00:00:00')
    expect(result.cleanedParagraphs[0].segmentIds).toEqual([1, 2, 3])
  })
})
