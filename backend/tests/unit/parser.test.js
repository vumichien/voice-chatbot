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
