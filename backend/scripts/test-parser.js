const { parseSRT, getStatistics } = require('../lib/parser')

async function main() {
  console.log('Testing SRT Parser...\n')

  const segments = await parseSRT('../data/transcript.srt')
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
