const { parseSRT } = require('../lib/parser')
const { reconstructText } = require('../lib/text-reconstructor')

async function main() {
  console.log('Testing Text Reconstructor...\n')

  // Parse transcript
  const segments = await parseSRT('../data/transcript.srt')
  console.log(`Parsed ${segments.length} segments\n`)

  // Reconstruct text
  const result = await reconstructText(segments)

  console.log('✅ Reconstruction successful!')
  console.log('\nStatistics:')
  console.log(`  Original segments: ${result.stats.originalSegments}`)
  console.log(`  Reconstructed sentences: ${result.stats.reconstructedSentences}`)
  console.log(`  Paragraphs formed: ${result.stats.paragraphs}`)
  console.log(`  Avg sentences per paragraph: ${result.stats.averageSentencesPerParagraph.toFixed(2)}`)

  console.log('\nFirst paragraph:')
  const firstPara = result.paragraphs[0]
  console.log(`  ID: ${firstPara.paragraphId}`)
  console.log(`  Time: ${firstPara.startTime} --> ${firstPara.endTime}`)
  console.log(`  Sentences: ${firstPara.sentences.length}`)
  console.log(`  Segment IDs: [${firstPara.segmentIds.join(', ')}]`)
  console.log(`  Text: ${firstPara.fullText.substring(0, 100)}...`)

  console.log('\nFirst 3 sentences:')
  result.sentences.slice(0, 3).forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.text.substring(0, 60)}...`)
    console.log(`     (Segments: ${s.segmentIds.join(', ')})`)
  })

  console.log('\n✅ All tests passed!')
}

main().catch(console.error)
