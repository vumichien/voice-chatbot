const {
  reconstructText,
  hasSentenceEnding,
  hasSilenceGap,
  mergeSentences
} = require('../../lib/text-reconstructor')

describe('Text Reconstructor', () => {

  // Test 1: Detect sentence endings
  test('hasSentenceEnding detects Japanese punctuation', () => {
    expect(hasSentenceEnding('テストです。')).toBe(true)
    expect(hasSentenceEnding('本当だよ！')).toBe(true)
    expect(hasSentenceEnding('どうですか？')).toBe(true)
    expect(hasSentenceEnding('続きます')).toBe(false)
  })

  // Test 2: Detect silence gaps
  test('hasSilenceGap detects >2 second gaps', () => {
    const seg1 = { endMs: 5000 }
    const seg2 = { startMs: 8000 }  // 3 second gap
    expect(hasSilenceGap(seg1, seg2, 2)).toBe(true)

    const seg3 = { startMs: 5500 }  // 0.5 second gap
    expect(hasSilenceGap(seg1, seg3, 2)).toBe(false)
  })

  // Test 3: Merge incomplete sentences
  test('mergeSentences combines broken sentences', () => {
    const segments = [
      { id: 1, text: '人を', startTime: '00:00:00', endTime: '00:00:02', startMs: 0, endMs: 2000 },
      { id: 2, text: '変えようとする', startTime: '00:00:02', endTime: '00:00:04', startMs: 2000, endMs: 4000 },
      { id: 3, text: 'ことはダメです。', startTime: '00:00:04', endTime: '00:00:06', startMs: 4000, endMs: 6000 }
    ]

    const sentences = mergeSentences(segments)

    expect(sentences).toHaveLength(1)
    expect(sentences[0].text).toBe('人を変えようとすることはダメです。')
    expect(sentences[0].segmentIds).toEqual([1, 2, 3])
  })

  // Test 4: Handle multiple sentences
  test('mergeSentences splits at sentence endings', () => {
    const segments = [
      { id: 1, text: '最初の文です。', startTime: '00:00:00', endTime: '00:00:02', startMs: 0, endMs: 2000 },
      { id: 2, text: '次の文です。', startTime: '00:00:02', endTime: '00:00:04', startMs: 2000, endMs: 4000 }
    ]

    const sentences = mergeSentences(segments)

    expect(sentences).toHaveLength(2)
  })

  // Test 5: Handle silence gaps
  test('mergeSentences splits on silence gaps', () => {
    const segments = [
      { id: 1, text: '最初の部分', startTime: '00:00:00', endTime: '00:00:02', startMs: 0, endMs: 2000 },
      { id: 2, text: '次の部分', startTime: '00:00:05', endTime: '00:00:07', startMs: 5000, endMs: 7000 } // 3 second gap
    ]

    const sentences = mergeSentences(segments)

    expect(sentences).toHaveLength(2)
  })
})
