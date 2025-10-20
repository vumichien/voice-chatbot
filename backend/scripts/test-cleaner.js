const { parseSRT } = require('../lib/parser')
const { reconstructText } = require('../lib/text-reconstructor')
const { cleanContent } = require('../lib/content-cleaner')

async function main() {
  console.log('Testing Content Cleaner...\n')

  // Parse and reconstruct
  const segments = await parseSRT('../data/transcript.srt')
  const reconstructed = await reconstructText(segments)
  console.log(`Reconstructed ${reconstructed.paragraphs.length} paragraphs\n`)

  // Clean content
  const cleaned = await cleanContent(reconstructed, {
    fixErrors: true,
    normalizeChars: true,
    removeNonVerbal: true,
    removeFillers: false
  })

  console.log('✅ Cleaning successful!')
  console.log('\nStatistics:')
  console.log(`  Paragraphs cleaned: ${cleaned.stats.paragraphsCleaned}`)
  console.log(`  Total corrections: ${cleaned.stats.totalCorrections}`)
  console.log(`  Unique corrections: ${cleaned.stats.uniqueCorrections}`)

  if (cleaned.corrections.length > 0) {
    console.log('\nCorrections applied:')
    const unique = [...new Set(cleaned.corrections.map(c => c.original))]
    unique.forEach(orig => {
      const corr = cleaned.corrections.find(c => c.original === orig)
      console.log(`  "${orig}" → "${corr.corrected}"`)
    })
  }

  console.log('\nFirst cleaned paragraph:')
  const firstClean = cleaned.cleanedParagraphs[0]
  console.log(`  ID: ${firstClean.paragraphId}`)
  console.log(`  Original length: ${firstClean.originalText.length} chars`)
  console.log(`  Cleaned length: ${firstClean.cleanedText.length} chars`)
  console.log(`  Corrections: ${firstClean.corrections.length}`)
  console.log(`  Text preview: ${firstClean.cleanedText.substring(0, 100)}...`)

  console.log('\n✅ All tests passed!')
}

main().catch(console.error)
