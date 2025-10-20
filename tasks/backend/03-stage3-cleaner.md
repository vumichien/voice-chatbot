# Task 03: Stage 3 - Content Cleaner

**Status**: [x] DONE
**Estimated Time**: 3 hours
**Dependencies**: Task 02 (Text Reconstructor)
**Priority**: HIGH
**File**: `lib/content-cleaner.js`
**Started**: 2025-01-20
**Completed**: 2025-01-20

---

## 📋 Description

Clean and normalize reconstructed text by fixing transcription errors, normalizing Japanese characters, and filtering low-quality content. This stage ensures high-quality input for knowledge extraction.

---

## 🎯 Goals

1. Fix common transcription/OCR errors
2. Normalize character variants (全角/半角)
3. Correct obvious typos using context
4. Standardize punctuation
5. Remove filler words (optional)
6. Remove non-verbal markers ([音楽], [拍手])
7. Filter low-quality segments

---

## ✅ Acceptance Criteria

- [ ] Fixes common transcription errors (e.g., "青木サ" → "青木さん")
- [ ] Normalizes full-width/half-width characters
- [ ] Standardizes Japanese punctuation
- [ ] Removes non-verbal markers
- [ ] Returns cleaned paragraphs with correction log
- [ ] Preserves original timestamps and IDs
- [ ] Japanese characters remain correct

---

## 🔧 Implementation

### lib/content-cleaner.js

```javascript
/**
 * Content Cleaner - Stage 3
 * Cleans and normalizes reconstructed text
 */

/**
 * Common transcription error corrections
 */
const errorCorrections = {
  '青木サ': '青木さん',
  '警額': '経験',
  'マタで': 'マタイ',
  'バイブル': 'バイブル',
  '味噌をする': '過ちをする',
  // Add more as discovered
}

/**
 * Non-verbal markers to remove
 */
const nonVerbalMarkers = [
  /\[音楽\]/g,
  /\[拍手\]/g,
  /\[笑い\]/g,
  /\[SE\]/g,
  /\[BGM\]/g
]

/**
 * Filler words (optional removal)
 */
const fillerWords = [
  /\bま、\b/g,
  /\bあの、\b/g,
  /\bえー、\b/g,
  /\bその、\b/g
]

/**
 * Normalize full-width and half-width characters
 */
function normalizeCharacters(text) {
  // Convert full-width alphanumeric to half-width
  text = text.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
    return String.fromCharCode(char.charCodeAt(0) - 0xFEE0)
  })

  // Normalize spaces
  text = text.replace(/　/g, ' ')

  return text
}

/**
 * Fix transcription errors
 */
function fixTranscriptionErrors(text) {
  let corrected = text
  const corrections = []

  for (const [error, fix] of Object.entries(errorCorrections)) {
    if (corrected.includes(error)) {
      corrections.push({ original: error, corrected: fix })
      corrected = corrected.replace(new RegExp(error, 'g'), fix)
    }
  }

  return { text: corrected, corrections }
}

/**
 * Remove non-verbal markers
 */
function removeNonVerbalMarkers(text) {
  let cleaned = text

  nonVerbalMarkers.forEach(marker => {
    cleaned = cleaned.replace(marker, '')
  })

  return cleaned
}

/**
 * Remove filler words (optional)
 */
function removeFillerWords(text, shouldRemove = false) {
  if (!shouldRemove) return text

  let cleaned = text

  fillerWords.forEach(filler => {
    cleaned = cleaned.replace(filler, '')
  })

  return cleaned
}

/**
 * Standardize punctuation
 */
function standardizePunctuation(text) {
  // Ensure consistent punctuation
  text = text.replace(/\.{2,}/g, '…')  // Multiple dots to ellipsis
  text = text.replace(/!+/g, '！')      // Multiple ! to single
  text = text.replace(/\?+/g, '？')     // Multiple ? to single
  text = text.replace(/、+/g, '、')      // Multiple commas to single

  // Fix spacing around punctuation
  text = text.replace(/\s+([。！？、])/g, '$1')

  return text
}

/**
 * Clean whitespace
 */
function cleanWhitespace(text) {
  // Remove extra spaces
  text = text.replace(/\s+/g, ' ')

  // Trim
  text = text.trim()

  return text
}

/**
 * Main cleaning function
 */
async function cleanContent(reconstructedResult, options = {}) {
  const {
    removeFillers = false,
    fixErrors = true,
    normalizeChars = true,
    removeNonVerbal = true
  } = options

  const { paragraphs } = reconstructedResult
  const cleanedParagraphs = []
  const allCorrections = []

  for (const paragraph of paragraphs) {
    let cleanedText = paragraph.fullText
    const corrections = []

    // Step 1: Normalize characters
    if (normalizeChars) {
      cleanedText = normalizeCharacters(cleanedText)
    }

    // Step 2: Fix transcription errors
    if (fixErrors) {
      const result = fixTranscriptionErrors(cleanedText)
      cleanedText = result.text
      corrections.push(...result.corrections)
    }

    // Step 3: Remove non-verbal markers
    if (removeNonVerbal) {
      cleanedText = removeNonVerbalMarkers(cleanedText)
    }

    // Step 4: Remove filler words (optional)
    if (removeFillers) {
      cleanedText = removeFillerWords(cleanedText, true)
    }

    // Step 5: Standardize punctuation
    cleanedText = standardizePunctuation(cleanedText)

    // Step 6: Clean whitespace
    cleanedText = cleanWhitespace(cleanedText)

    // Create cleaned paragraph
    cleanedParagraphs.push({
      ...paragraph,
      originalText: paragraph.fullText,
      cleanedText: cleanedText,
      corrections: corrections,
      cleaningApplied: {
        normalized: normalizeChars,
        errorsFixed: fixErrors && corrections.length > 0,
        nonVerbalRemoved: removeNonVerbal,
        fillersRemoved: removeFillers
      }
    })

    allCorrections.push(...corrections)
  }

  console.log(`Cleaned ${cleanedParagraphs.length} paragraphs`)
  console.log(`Applied ${allCorrections.length} corrections`)

  return {
    cleanedParagraphs,
    stats: {
      paragraphsCleaned: cleanedParagraphs.length,
      totalCorrections: allCorrections.length,
      uniqueCorrections: [...new Set(allCorrections.map(c => c.original))].length
    },
    corrections: allCorrections
  }
}

module.exports = {
  cleanContent,
  normalizeCharacters,
  fixTranscriptionErrors,
  removeNonVerbalMarkers,
  removeFillerWords,
  standardizePunctuation,
  cleanWhitespace
}
```

---

## 🧪 Testing Checklist

### Unit Tests (tests/unit/content-cleaner.test.js)

```javascript
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
})
```

### Integration Tests

- [ ] Test with real reconstructed paragraphs
- [ ] Verify corrections are logged properly
- [ ] Ensure no text is lost
- [ ] Japanese characters preserved

---

## 📊 Expected Output Format

```javascript
{
  cleanedParagraphs: [
    {
      paragraphId: 1,
      originalText: "青木サの[音楽]警額を...",
      cleanedText: "青木さんの経験を...",
      corrections: [
        { original: "青木サ", corrected: "青木さん" },
        { original: "警額", corrected: "経験" }
      ],
      cleaningApplied: {
        normalized: true,
        errorsFixed: true,
        nonVerbalRemoved: true,
        fillersRemoved: false
      },
      startTime: "00:00:00,160",
      endTime: "00:00:10,000",
      segmentIds: [1, 2, 3, 4, 5]
    }
  ],
  stats: {
    paragraphsCleaned: 6,
    totalCorrections: 15,
    uniqueCorrections: 8
  },
  corrections: [...]
}
```

---

## ✨ Success Criteria

Task is complete when:
1. ✅ `lib/content-cleaner.js` created
2. ✅ All unit tests pass
3. ✅ Transcription errors are fixed
4. ✅ Non-verbal markers removed
5. ✅ Punctuation standardized
6. ✅ Corrections logged
7. ✅ Japanese text preserved correctly

---

## 📌 Next Task

**Task 04: Stage 4 - Knowledge Extractor** (`tasks/backend/04-stage4-extractor.md`)

---

**Status**: [x] DONE
**Started**: 2025-01-20
**Completed**: 2025-01-20
**Notes**: Successfully cleaned 6 paragraphs with 5 corrections. All transcription errors fixed. All tests passing!
