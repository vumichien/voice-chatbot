# Task 02: Stage 2 - Text Reconstructor

**Status**: [ ] TODO
**Estimated Time**: 4 hours
**Dependencies**: Task 01 (Parser)
**Priority**: HIGH
**File**: `lib/text-reconstructor.js`

---

## 📋 Description

Reconstruct complete sentences and paragraphs from fragmented SRT segments. SRT files break text mid-sentence for subtitle display - this stage merges fragments into coherent, complete sentences grouped by topic.

---

## 🎯 Goals

1. Detect Japanese sentence boundaries (。！？、)
2. Merge incomplete fragments across segments
3. Form paragraphs based on topic continuity
4. Preserve timestamp ranges
5. Use silence gaps (>2s) as paragraph breaks
6. Handle speaker changes

---

## ✅ Acceptance Criteria

- [ ] Identifies sentence boundaries correctly
- [ ] Merges broken sentences across segments
- [ ] Groups related sentences into paragraphs
- [ ] Preserves original segment IDs and timestamps
- [ ] Handles edge cases (single-segment sentences)
- [ ] Returns structured paragraph objects
- [ ] Works with Japanese punctuation

---

## 🔧 Implementation

### lib/text-reconstructor.js

```javascript
const kuromoji = require('kuromoji')
const { promisify } = require('util')

// Initialize tokenizer (lazy load)
let tokenizerPromise = null

function getTokenizer() {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' })
        .build((err, tokenizer) => {
          if (err) reject(err)
          else resolve(tokenizer)
        })
    })
  }
  return tokenizerPromise
}

/**
 * Check if text ends with sentence-ending punctuation
 */
function hasSentenceEnding(text) {
  const endings = ['。', '！', '？', '!', '?', '.']
  return endings.some(ending => text.trim().endsWith(ending))
}

/**
 * Check if there's a significant silence gap
 */
function hasSilenceGap(segment1, segment2, thresholdSec = 2) {
  const gap = (segment2.startMs - segment1.endMs) / 1000
  return gap > thresholdSec
}

/**
 * Merge segments into sentences
 */
function mergeSentences(segments) {
  const sentences = []
  let currentSentence = {
    text: '',
    segmentIds: [],
    startTime: null,
    endTime: null
  }

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]

    // Initialize
    if (!currentSentence.startTime) {
      currentSentence.startTime = segment.startTime
    }

    // Add text and track segment
    currentSentence.text += segment.text
    currentSentence.segmentIds.push(segment.id)
    currentSentence.endTime = segment.endTime

    // Check if sentence is complete
    const isComplete = hasSentenceEnding(segment.text)
    const nextSegment = segments[i + 1]
    const hasGap = nextSegment && hasSilenceGap(segment, nextSegment)

    // End sentence if complete or has gap
    if (isComplete || hasGap || i === segments.length - 1) {
      sentences.push({ ...currentSentence })

      // Reset for next sentence
      currentSentence = {
        text: '',
        segmentIds: [],
        startTime: null,
        endTime: null
      }
    }
  }

  return sentences
}

/**
 * Group sentences into paragraphs
 */
function formParagraphs(sentences, maxSentencesPerParagraph = 5) {
  const paragraphs = []
  let currentParagraph = {
    paragraphId: 1,
    sentences: [],
    fullText: '',
    startTime: null,
    endTime: null,
    segmentIds: []
  }

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i]

    // Initialize
    if (!currentParagraph.startTime) {
      currentParagraph.startTime = sentence.startTime
    }

    // Add sentence
    currentParagraph.sentences.push(sentence.text.trim())
    currentParagraph.fullText += sentence.text.trim()
    currentParagraph.segmentIds.push(...sentence.segmentIds)
    currentParagraph.endTime = sentence.endTime

    // End paragraph if max size reached or gap detected
    const shouldEndParagraph =
      currentParagraph.sentences.length >= maxSentencesPerParagraph ||
      i === sentences.length - 1

    if (shouldEndParagraph) {
      paragraphs.push({ ...currentParagraph })

      // Reset for next paragraph
      currentParagraph = {
        paragraphId: paragraphs.length + 1,
        sentences: [],
        fullText: '',
        startTime: null,
        endTime: null,
        segmentIds: []
      }
    }
  }

  return paragraphs
}

/**
 * Main function: Reconstruct text from segments
 */
async function reconstructText(segments, options = {}) {
  const {
    maxSentencesPerParagraph = 5,
    silenceThreshold = 2
  } = options

  // Step 1: Merge into sentences
  const sentences = mergeSentences(segments)

  console.log(`Reconstructed ${sentences.length} sentences from ${segments.length} segments`)

  // Step 2: Form paragraphs
  const paragraphs = formParagraphs(sentences, maxSentencesPerParagraph)

  console.log(`Formed ${paragraphs.length} paragraphs`)

  return {
    sentences,
    paragraphs,
    stats: {
      originalSegments: segments.length,
      reconstructedSentences: sentences.length,
      paragraphs: paragraphs.length,
      averageSentencesPerParagraph: sentences.length / paragraphs.length
    }
  }
}

module.exports = {
  reconstructText,
  mergeSentences,
  formParagraphs,
  hasSentenceEnding,
  hasSilenceGap
}
```

---

## 🧪 Testing Checklist

### Unit Tests (tests/unit/text-reconstructor.test.js)

```javascript
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
})
```

### Integration Tests

- [ ] **Test with parsed transcript data**:
  ```bash
  node -e "
    const { parseSRT } = require('./lib/parser')
    const { reconstructText } = require('./lib/text-reconstructor')

    parseSRT('./data/transcript.srt')
      .then(reconstructText)
      .then(result => {
        console.log('Sentences:', result.sentences.length)
        console.log('Paragraphs:', result.paragraphs.length)
        console.log('First paragraph:', result.paragraphs[0])
      })
  "
  ```

- [ ] **Expected output**:
  - Sentences: ~50-80 (down from 288 segments)
  - Paragraphs: ~15-25
  - Each paragraph contains 3-5 sentences
  - No broken fragments

### Manual Testing

- [ ] Check first reconstructed paragraph manually
- [ ] Verify sentence boundaries are correct
- [ ] Ensure no text is lost or duplicated
- [ ] Japanese characters preserved

---

## 📊 Expected Output Format

```javascript
{
  sentences: [
    {
      text: "人間ってやっぱり変わらないんだよ。",
      segmentIds: [2, 3],
      startTime: "00:00:03,879",
      endTime: "00:00:10,080"
    }
  ],
  paragraphs: [
    {
      paragraphId: 1,
      sentences: [
        "人間ってやっぱり変わらないんだよ。",
        "人を変えようということ自体しない方がいいと思う。"
      ],
      fullText: "人間ってやっぱり変わらないんだよ。人を変えようということ自体しない方がいいと思う。",
      startTime: "00:00:03,879",
      endTime: "00:00:28,120",
      segmentIds: [2, 3, 4, 5, 6, 7, 8]
    }
  ],
  stats: {
    originalSegments: 288,
    reconstructedSentences: 65,
    paragraphs: 18,
    averageSentencesPerParagraph: 3.6
  }
}
```

---

## ✨ Success Criteria

Task is complete when:
1. ✅ `lib/text-reconstructor.js` created
2. ✅ All unit tests pass
3. ✅ Reduces ~288 segments to ~50-80 sentences
4. ✅ Forms ~15-25 coherent paragraphs
5. ✅ No text lost or duplicated
6. ✅ Sentence boundaries correct

---

## 📌 Next Task

**Task 03: Stage 3 - Content Cleaner** (`tasks/backend/03-stage3-cleaner.md`)

---

**Status**: [ ] TODO
**Started**: _____
**Completed**: _____
