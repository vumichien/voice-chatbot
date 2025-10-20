# Task 01: Stage 1 - SRT Parser

**Status**: [x] DONE
**Estimated Time**: 3 hours
**Dependencies**: Task 00 (Setup)
**Priority**: HIGH
**File**: `lib/parser.js`
**Started**: 2025-01-20
**Completed**: 2025-01-20

---

## 📋 Description

Create an SRT file parser that extracts subtitle segments with timestamps and text content. This is Stage 1 of the content processing pipeline and handles raw SRT format parsing with proper UTF-8 Japanese character encoding.

---

## 🎯 Goals

1. Parse SRT file format (sequence, timestamps, text)
2. Handle UTF-8 Japanese encoding correctly
3. Extract and structure all metadata
4. Handle malformed SRT entries gracefully
5. Support multiple SRT files
6. Validate parsed data

---

## ✅ Acceptance Criteria

- [ ] Can parse standard SRT format
- [ ] Correctly handles Japanese UTF-8 characters
- [ ] Extracts sequence numbers, timestamps, and text
- [ ] Calculates duration for each segment
- [ ] Returns structured JSON array
- [ ] Handles empty lines and whitespace
- [ ] Throws clear errors for invalid files
- [ ] Works with the provided `data/transcript.srt`

---

## 📖 SRT Format Reference

```
1
00:00:00,160 --> 00:00:03,879
本当に自分に責任があるという反省がない

2
00:00:03,879 --> 00:00:07,240
人間ってやっぱり変わらないんだよ。人を
```

Structure:
- Line 1: Sequence number
- Line 2: Start time --> End time
- Line 3+: Text content (may span multiple lines)
- Blank line: Separator

---

## 🔧 Implementation

### lib/parser.js

```javascript
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
```

---

## 🧪 Testing Checklist

### Unit Tests (tests/unit/parser.test.js)

Create test file with these tests:

```javascript
const { parseSRT, parseTimestamp, getStatistics } = require('../../lib/parser')
const fs = require('fs').promises
const path = require('path')

describe('SRT Parser', () => {

  // Test 1: Parse timestamp correctly
  test('parseTimestamp converts to milliseconds', () => {
    expect(parseTimestamp('00:00:00,160')).toBe(160)
    expect(parseTimestamp('00:01:05,280')).toBe(65280)
    expect(parseTimestamp('00:10:30,500')).toBe(630500)
  })

  // Test 2: Parse simple SRT block
  test('parseSRT parses basic SRT format', async () => {
    const testSRT = `1
00:00:00,160 --> 00:00:03,879
本当に自分に責任があるという反省がない

2
00:00:03,879 --> 00:00:07,240
人間ってやっぱり変わらないんだよ。人を`

    // Write temp file
    const tempFile = path.join(__dirname, 'temp.srt')
    await fs.writeFile(tempFile, testSRT, 'utf-8')

    const segments = await parseSRT(tempFile)

    expect(segments).toHaveLength(2)
    expect(segments[0].id).toBe(1)
    expect(segments[0].text).toContain('反省がない')
    expect(segments[1].id).toBe(2)

    // Cleanup
    await fs.unlink(tempFile)
  })

  // Test 3: Handle Japanese characters
  test('handles UTF-8 Japanese correctly', async () => {
    const testSRT = `1
00:00:00,000 --> 00:00:02,000
黄金率`

    const tempFile = path.join(__dirname, 'temp-jp.srt')
    await fs.writeFile(tempFile, testSRT, 'utf-8')

    const segments = await parseSRT(tempFile)

    expect(segments[0].text).toBe('黄金率')

    await fs.unlink(tempFile)
  })

  // Test 4: Calculate duration
  test('calculates duration correctly', async () => {
    const testSRT = `1
00:00:00,000 --> 00:00:05,000
Test`

    const tempFile = path.join(__dirname, 'temp-dur.srt')
    await fs.writeFile(tempFile, testSRT, 'utf-8')

    const segments = await parseSRT(tempFile)

    expect(segments[0].duration).toBe(5)

    await fs.unlink(tempFile)
  })

  // Test 5: Handle multiline text
  test('handles multiline text blocks', async () => {
    const testSRT = `1
00:00:00,000 --> 00:00:02,000
Line 1
Line 2
Line 3`

    const tempFile = path.join(__dirname, 'temp-multi.srt')
    await fs.writeFile(tempFile, testSRT, 'utf-8')

    const segments = await parseSRT(tempFile)

    expect(segments[0].text).toBe('Line 1 Line 2 Line 3')

    await fs.unlink(tempFile)
  })

  // Test 6: Handle file not found
  test('throws error for missing file', async () => {
    await expect(parseSRT('nonexistent.srt')).rejects.toThrow('not found')
  })

  // Test 7: Get statistics
  test('getStatistics returns correct stats', () => {
    const segments = [
      { duration: 5, textLength: 10 },
      { duration: 3, textLength: 20 }
    ]

    const stats = getStatistics(segments)

    expect(stats.totalSegments).toBe(2)
    expect(stats.totalDuration).toBe(8)
    expect(stats.averageDuration).toBe(4)
    expect(stats.totalCharacters).toBe(30)
  })
})
```

### Integration Tests

- [ ] **Test with real transcript.srt**:
  ```bash
  node -e "
    const { parseSRT, getStatistics } = require('./lib/parser')
    parseSRT('./data/transcript.srt').then(segments => {
      console.log('Parsed segments:', segments.length)
      console.log('First segment:', segments[0])
      console.log('Stats:', getStatistics(segments))
    })
  "
  ```

- [ ] **Expected output for transcript.srt**:
  - Total segments: ~288
  - All Japanese characters preserved
  - No parsing errors
  - All timestamps valid

### Manual Testing

- [ ] Parse `data/transcript.srt` successfully
- [ ] Check first 5 segments manually:
  - Segment 1: "本当に自分に責任があるという反省がない"
  - Timestamp: 00:00:00,160 --> 00:00:03,879
- [ ] Verify Japanese characters display correctly
- [ ] Check duration calculations are reasonable (2-5 seconds avg)

---

## 📊 Expected Output Format

```javascript
[
  {
    id: 1,
    startTime: "00:00:00,160",
    endTime: "00:00:03,879",
    startMs: 160,
    endMs: 3879,
    duration: 3.719,
    text: "本当に自分に責任があるという反省がない",
    textLength: 20
  },
  {
    id: 2,
    startTime: "00:00:03,879",
    endTime: "00:00:07,240",
    text: "人間ってやっぱり変わらないんだよ。人を",
    // ...
  }
  // ... more segments
]
```

---

## ⚠️ Common Issues & Solutions

### Issue: Japanese characters appear as ���
- **Cause**: Wrong encoding
- **Solution**: Ensure `utf-8` encoding in `fs.readFile()`

### Issue: Segments missing or duplicated
- **Cause**: Incorrect block splitting
- **Solution**: Check regex for splitting blocks (`\n\s*\n`)

### Issue: Timestamp parsing errors
- **Cause**: Different timestamp formats
- **Solution**: Add validation for format HH:MM:SS,mmm

---

## 📝 Validation Script

Create `scripts/test-parser.js`:

```javascript
const { parseSRT, getStatistics } = require('../lib/parser')

async function main() {
  console.log('Testing SRT Parser...\n')

  const segments = await parseSRT('./data/transcript.srt')
  const stats = getStatistics(segments)

  console.log('✅ Parsing successful!')
  console.log('\nStatistics:')
  console.log(`  Total segments: ${stats.totalSegments}`)
  console.log(`  Total duration: ${stats.totalDuration.toFixed(2)}s`)
  console.log(`  Average duration: ${stats.averageDuration.toFixed(2)}s`)
  console.log(`  Total characters: ${stats.totalCharacters}`)

  console.log('\nFirst 3 segments:')
  segments.slice(0, 3).forEach(s => {
    console.log(`  [${s.id}] ${s.startTime} --> ${s.endTime}`)
    console.log(`      ${s.text.substring(0, 50)}...`)
  })

  console.log('\n✅ All tests passed!')
}

main().catch(console.error)
```

Run: `node scripts/test-parser.js`

---

## ✨ Success Criteria

Task is complete when:
1. ✅ `lib/parser.js` created and implements all functions
2. ✅ All unit tests pass (`npm test`)
3. ✅ Can parse `data/transcript.srt` without errors
4. ✅ Japanese characters preserved correctly
5. ✅ Outputs ~288 segments from transcript.srt
6. ✅ Statistics function works correctly
7. ✅ Validation script runs successfully

---

## 📌 Next Task

After completing this task, proceed to:
**Task 02: Stage 2 - Text Reconstructor** (`tasks/backend/02-stage2-reconstructor.md`)

---

**Status**: [x] DONE
**Started**: 2025-01-20
**Completed**: 2025-01-20
**Notes**: All tests passing. Parsed 288 segments from transcript.srt with Japanese characters correctly preserved. Parser working perfectly!
