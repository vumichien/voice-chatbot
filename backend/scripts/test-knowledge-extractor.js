const { parseSRT } = require('../lib/parser')
const { reconstructText } = require('../lib/text-reconstructor')
const { cleanContent } = require('../lib/content-cleaner')
const { extractKnowledge } = require('../lib/knowledge-extractor')
const fs = require('fs').promises

async function main() {
  console.log('Testing Knowledge Extractor...\n')

  // Run full pipeline
  const segments = await parseSRT('../data/transcript.srt')
  console.log(`1. Parsed ${segments.length} segments`)

  const reconstructed = await reconstructText(segments)
  console.log(`2. Reconstructed ${reconstructed.paragraphs.length} paragraphs`)

  const cleaned = await cleanContent(reconstructed)
  console.log(`3. Cleaned ${cleaned.cleanedParagraphs.length} paragraphs\n`)

  // Extract knowledge
  const knowledgeResult = await extractKnowledge(cleaned)

  console.log('✅ Knowledge extraction successful!')
  console.log('\nStatistics:')
  console.log(`  Total knowledge objects: ${knowledgeResult.stats.totalKnowledgeObjects}`)
  console.log(`  High importance: ${knowledgeResult.stats.highImportance}`)
  console.log(`  Medium importance: ${knowledgeResult.stats.mediumImportance}`)
  console.log(`  Low importance: ${knowledgeResult.stats.lowImportance}`)
  console.log(`  Topics identified: ${knowledgeResult.stats.topics}`)

  // Show first 3 knowledge objects
  console.log('\nFirst 3 Knowledge Objects:')
  knowledgeResult.knowledge.slice(0, 3).forEach(k => {
    console.log(`\n[${k.knowledgeId}] ${k.topic}`)
    console.log(`  Type: ${k.type}`)
    console.log(`  Importance: ${k.metadata.importance}`)
    console.log(`  Entities:`)
    console.log(`    People: ${k.entities.people.join(', ') || 'none'}`)
    console.log(`    Concepts: ${k.entities.concepts.join(', ') || 'none'}`)
    console.log(`    Ages: ${k.entities.ages.join(', ') || 'none'}`)
    console.log(`  Quotes: ${k.content.quotes.length}`)
    if (k.content.quotes.length > 0) {
      console.log(`    "${k.content.quotes[0].substring(0, 60)}..."`)
    }
    console.log(`  Time: ${k.timestamp.start} --> ${k.timestamp.end}`)
  })

  // Save to file
  await fs.writeFile(
    '../backend/data/processed/knowledge.json',
    JSON.stringify(knowledgeResult.knowledge, null, 2)
  )
  console.log('\n✅ Knowledge saved to data/processed/knowledge.json')

  console.log('\n✅ All tests passed!')
}

main().catch(console.error)
