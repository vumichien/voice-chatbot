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
