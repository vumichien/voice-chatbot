const fs = require('fs').promises
const path = require('path')

/**
 * Parse SRT timestamp to milliseconds
 * Format: HH:MM:SS,mmm
 */
function parseTimestamp(timestamp) {
  const [time, ms] = timestamp.trim().split(',')
  const [hours, minutes, seconds] = time.split(':').map(Number)

  return (
    hours * 3600000 +
    minutes * 60000 +
    seconds * 1000 +
    Number(ms)
  )
}

/**
 * Parse SRT file and return structured segments
 * @param {string} filePath - Path to SRT file
 * @returns {Promise<Array>} Parsed segments
 */
async function parseSRT(filePath) {
  try {
    // Read file with UTF-8 encoding
    const content = await fs.readFile(filePath, 'utf-8')

    // Split into blocks (separated by double newlines)
    const blocks = content
      .trim()
      .split(/\n\s*\n/)
      .filter(block => block.trim())

    const segments = []

    for (const block of blocks) {
      const lines = block.split('\n').map(line => line.trim())

      if (lines.length < 3) {
        console.warn(`Skipping malformed block: ${block.substring(0, 50)}`)
        continue
      }

      // Parse sequence number
      const id = parseInt(lines[0], 10)

      // Parse timestamps
      const timestampLine = lines[1]
      const [startTime, endTime] = timestampLine.split('-->').map(t => t.trim())

      // Parse text (everything after timestamp line)
      const text = lines.slice(2).join(' ').trim()

      // Calculate duration
      const startMs = parseTimestamp(startTime)
      const endMs = parseTimestamp(endTime)
      const duration = (endMs - startMs) / 1000 // in seconds

      segments.push({
        id,
        startTime,
        endTime,
        startMs,
        endMs,
        duration,
        text,
        textLength: text.length
      })
    }

    return segments

  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`SRT file not found: ${filePath}`)
    }
    throw new Error(`Failed to parse SRT: ${error.message}`)
  }
}

/**
 * Get statistics about parsed SRT
 */
function getStatistics(segments) {
  return {
    totalSegments: segments.length,
    totalDuration: segments.reduce((sum, s) => sum + s.duration, 0),
    averageDuration: segments.reduce((sum, s) => sum + s.duration, 0) / segments.length,
    totalCharacters: segments.reduce((sum, s) => sum + s.textLength, 0),
    averageCharacters: segments.reduce((sum, s) => sum + s.textLength, 0) / segments.length
  }
}

module.exports = {
  parseSRT,
  parseTimestamp,
  getStatistics
}
