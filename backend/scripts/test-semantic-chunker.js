/**
 * Test Script for Semantic Chunker
 *
 * Tests the semantic chunking functionality with real data
 * from the knowledge extractor.
 */

const fs = require('fs')
const path = require('path')
const { createSemanticChunks, validateChunks } = require('../lib/semantic-chunker')
const { extractKnowledge } = require('../lib/knowledge-extractor')
const { cleanContent } = require('../lib/content-cleaner')
const { reconstructText } = require('../lib/text-reconstructor')
const { parseSRT } = require('../lib/parser')

async function main() {
  console.log('🔄 Stage 5: Semantic Chunker Test\n')

  // Load transcript
  const transcriptPath = path.join(__dirname, '../../data/transcript.srt')
  console.log(`📖 Loading transcript: ${transcriptPath}`)

  // Stage 1: Parse
  console.log('\n📝 Stage 1: Parsing SRT...')
  const segments = await parseSRT(transcriptPath)
  console.log(`   ✓ Parsed ${segments.length} segments`)

  // Stage 2: Reconstruct
  console.log('\n🔨 Stage 2: Reconstructing text...')
  const reconstructed = await reconstructText(segments)
  console.log(`   ✓ Created ${reconstructed.paragraphs.length} paragraphs`)

  // Stage 3: Clean
  console.log('\n🧹 Stage 3: Cleaning content...')
  const cleaned = await cleanContent(reconstructed)
  console.log(`   ✓ Cleaned ${cleaned.cleanedParagraphs.length} paragraphs`)

  // Stage 4: Extract knowledge
  console.log('\n🧠 Stage 4: Extracting knowledge...')
  const knowledgeData = await extractKnowledge(cleaned)
  console.log(`   ✓ Extracted ${knowledgeData.knowledge.length} knowledge objects`)
  console.log(`   • High importance: ${knowledgeData.stats.highImportance}`)
  console.log(`   • Medium importance: ${knowledgeData.stats.mediumImportance}`)
  console.log(`   • Low importance: ${knowledgeData.stats.lowImportance}`)

  // Stage 5: Create semantic chunks
  console.log('\n🧩 Stage 5: Creating semantic chunks...')
  const result = createSemanticChunks(knowledgeData, {
    minChunkSize: 200,
    maxChunkSize: 1000,
    includeContext: true
  })

  console.log(`   ✓ Created ${result.chunks.length} semantic chunks`)
  console.log(`   • Average chunk size: ${result.stats.avgChunkSize} chars`)
  console.log(`   • Size distribution:`)
  console.log(`     - Small (<400 chars): ${result.stats.sizeDistribution.small}`)
  console.log(`     - Medium (400-700): ${result.stats.sizeDistribution.medium}`)
  console.log(`     - Large (>700): ${result.stats.sizeDistribution.large}`)
  console.log(`   • By importance:`)
  console.log(`     - High: ${result.stats.byImportance.high}`)
  console.log(`     - Medium: ${result.stats.byImportance.medium}`)
  console.log(`     - Low: ${result.stats.byImportance.low}`)

  // Validate chunks
  console.log('\n✅ Validating chunks...')
  const validation = validateChunks(result.chunks)

  if (validation.valid) {
    console.log('   ✓ All chunks are valid!')
  } else {
    console.log('   ⚠️ Validation issues found:')
    validation.issues.forEach(issue => {
      console.log(`     - ${issue}`)
    })
  }

  // Display sample chunks
  console.log('\n📋 Sample Chunks:')
  console.log('=' .repeat(80))

  result.chunks.slice(0, 3).forEach((chunk, index) => {
    console.log(`\n${index + 1}. Chunk ID: ${chunk.chunkId}`)
    console.log(`   Topic: ${chunk.metadata.topic}`)
    console.log(`   Importance: ${chunk.metadata.importance}`)
    console.log(`   Size: ${chunk.content.length} chars`)
    console.log(`   Keywords: ${chunk.metadata.keywords.join(', ')}`)
    console.log(`   Context Before: ${chunk.metadata.contextBefore || 'None'}`)
    console.log(`   Context After: ${chunk.metadata.contextAfter || 'None'}`)
    console.log(`   Content Preview: ${chunk.content.substring(0, 150)}...`)
  })

  console.log('\n' + '='.repeat(80))

  // Save chunks to file
  const outputPath = path.join(__dirname, '../output/chunks.json')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`\n💾 Saved chunks to: ${outputPath}`)

  // Display summary
  console.log('\n📊 Summary:')
  console.log(`   • Total knowledge objects: ${result.stats.totalKnowledge}`)
  console.log(`   • Total chunks: ${result.stats.totalChunks}`)
  console.log(`   • Chunks per knowledge: ${(result.stats.totalChunks / result.stats.totalKnowledge).toFixed(2)}`)
  console.log(`   • Average chunk size: ${result.stats.avgChunkSize} chars`)

  // Check if within expected range (40-60 chunks)
  if (result.chunks.length >= 40 && result.chunks.length <= 60) {
    console.log('\n✅ SUCCESS: Chunk count is within expected range (40-60)')
  } else if (result.chunks.length < 40) {
    console.log(`\n⚠️ WARNING: Fewer chunks than expected (${result.chunks.length} < 40)`)
  } else {
    console.log(`\n⚠️ WARNING: More chunks than expected (${result.chunks.length} > 60)`)
  }

  console.log('\n✅ Stage 5 Test Complete!\n')
}

// Run test
main().catch(error => {
  console.error('\n❌ Error during test:')
  console.error(error)
  process.exit(1)
})
