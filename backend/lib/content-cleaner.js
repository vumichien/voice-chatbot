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
  text = text.replace(/。{2,}/g, '…')   // Multiple Japanese periods to ellipsis
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
