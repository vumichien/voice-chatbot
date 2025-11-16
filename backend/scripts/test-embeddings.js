/**
 * Test Script for Embeddings Generator
 *
 * Tests embedding generation with real chunk data
 */

const fs = require('fs')
const path = require('path')
const { generateEmbeddings, validateEmbeddings, prepareTextForEmbedding } = require('../lib/embeddings')
const { createSemanticChunks } = require('../lib/semantic-chunker')
const { extractKnowledge } = require('../lib/knowledge-extractor')
const { cleanContent } = require('../lib/content-cleaner')
const { reconstructText } = require('../lib/text-reconstructor')
const { parseSRT } = require('../lib/parser')

// Load environment variables
require('dotenv').config()

async function main() {
  console.log('🔄 Stage 6: Embeddings Generator Test\n')

  // Check API keys
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasHF = !!(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN)

  console.log('📋 Checking embedding credentials:')
  console.log(`   OpenAI: ${hasOpenAI ? '✓' : '✗'}`)
  console.log(`   HuggingFace: ${hasHF ? '✓' : '✗'}`)

  if (!hasOpenAI && !hasHF) {
    console.error('\n❌ No embedding API keys found!')
    console.log('\nPlease set one of the following in your .env file:')
    console.log('\n**For HuggingFace (FREE, Recommended for Japanese)**:')
    console.log('  HUGGINGFACE_API_KEY=your_hf_token')
    console.log('  Get free token at: https://huggingface.co/settings/tokens')
    console.log('\n**For OpenAI**:')
    console.log('  OPENAI_API_KEY=your_openai_key')
    process.exit(1)
  }

  // Determine provider and model
  const provider = hasHF ? 'huggingface' : 'openai'
  const model = hasHF ? 'ibm-granite' : 'openai-small'

  console.log(`\n✓ Using ${provider} provider`)
  console.log(`✓ Model: ${model}\n`)

  // Load transcript
  const transcriptPath = path.join(__dirname, '../../data/transcript.srt')
  console.log(`📖 Loading transcript: ${transcriptPath}`)

  // Stage 1-5: Get chunks
  console.log('\n📝 Running pipeline stages 1-5...')
  const segments = await parseSRT(transcriptPath)
  console.log(`   ✓ Stage 1: Parsed ${segments.length} segments`)

  const reconstructed = await reconstructText(segments)
  console.log(`   ✓ Stage 2: Created ${reconstructed.paragraphs.length} paragraphs`)

  const cleaned = await cleanContent(reconstructed)
  console.log(`   ✓ Stage 3: Cleaned ${cleaned.cleanedParagraphs.length} paragraphs`)

  const knowledgeData = await extractKnowledge(cleaned)
  console.log(`   ✓ Stage 4: Extracted ${knowledgeData.knowledge.length} knowledge objects`)

  const chunksData = createSemanticChunks(knowledgeData)
  console.log(`   ✓ Stage 5: Created ${chunksData.chunks.length} semantic chunks`)

  // Stage 6: Generate embeddings
  console.log('\n🎯 Stage 6: Generating embeddings...')
  console.log(`Processing ${chunksData.chunks.length} chunks`)

  // Show sample prepared text
  console.log('\n📄 Sample prepared text for embedding:')
  console.log('='.repeat(80))
  const samplePrepared = prepareTextForEmbedding(chunksData.chunks[0])
  console.log(samplePrepared.substring(0, 200) + '...')
  console.log('='.repeat(80))

  // Generate embeddings with progress tracking
  const result = await generateEmbeddings(chunksData, {
    provider,
    model,
    batchSize: 100,
    onProgress: (progress) => {
      console.log(`   Progress: ${progress.percentage}% (${progress.processed}/${progress.total})`)
    }
  })

  console.log(`\n✅ Embeddings generated successfully!`)
  console.log(`   • Provider: ${result.stats.provider}`)
  console.log(`   • Model: ${result.stats.model}`)
  console.log(`   • Total chunks: ${result.stats.totalChunks}`)
  console.log(`   • Embedding dimensions: ${result.stats.totalDimensions}`)
  console.log(`   • Processing time: ${result.stats.processingTime.toFixed(2)}s`)
  console.log(`   • Average time per chunk: ${result.stats.avgTimePerChunk.toFixed(3)}s`)
  if (result.stats.estimatedCost > 0) {
    console.log(`   • Estimated cost: $${result.stats.estimatedCost.toFixed(4)}`)
  } else {
    console.log(`   • Cost: FREE`)
  }

  // Validate embeddings
  console.log('\n✅ Validating embeddings...')
  const validation = validateEmbeddings(result.chunks)

  if (validation.valid) {
    console.log('   ✓ All embeddings are valid!')
  } else {
    console.log('   ⚠️ Validation issues found:')
    validation.issues.forEach(issue => {
      console.log(`     - ${issue}`)
    })
  }

  // Display sample embeddings
  console.log('\n📊 Sample Embeddings:')
  console.log('='.repeat(80))

  result.chunks.slice(0, 2).forEach((chunk, index) => {
    console.log(`\n${index + 1}. Chunk ID: ${chunk.chunkId}`)
    console.log(`   Topic: ${chunk.metadata.topic}`)
    console.log(`   Content length: ${chunk.content.length} chars`)
    console.log(`   Embedding dimensions: ${chunk.embedding.length}`)
    console.log(`   First 10 values: [${chunk.embedding.slice(0, 10).map(v => v.toFixed(4)).join(', ')}...]`)
    console.log(`   Generated at: ${chunk.embeddingMetadata.generatedAt}`)
  })

  console.log('\n' + '='.repeat(80))

  // Save embeddings to file
  const outputPath = path.join(__dirname, '../output/embeddings.json')
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8')
  console.log(`\n💾 Saved embeddings to: ${outputPath}`)

  // Calculate file size
  const stats = fs.statSync(outputPath)
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)
  console.log(`   File size: ${fileSizeMB} MB`)

  // Display summary
  console.log('\n📊 Summary:')
  console.log(`   • Provider: ${result.stats.provider}`)
  console.log(`   • Model: ${result.stats.model}`)
  console.log(`   • Total chunks processed: ${result.chunks.length}`)
  console.log(`   • All embeddings: ${result.stats.totalDimensions}D vectors`)
  console.log(`   • Total processing time: ${result.stats.processingTime.toFixed(2)}s`)
  if (result.stats.estimatedCost > 0) {
    console.log(`   • Estimated API cost: $${result.stats.estimatedCost.toFixed(4)}`)
  } else {
    console.log(`   • Cost: FREE (HuggingFace)`)
  }

  console.log('\n✅ Stage 6 Test Complete!\n')
}

// Run test
main().catch(error => {
  console.error('\n❌ Error during test:')
  console.error(error)
  process.exit(1)
})
