/**
 * Process Transcript Script
 *
 * Runs the complete 7-stage content processing pipeline to:
 * 1. Parse SRT subtitle file
 * 2. Reconstruct broken sentences
 * 3. Clean and normalize content
 * 4. Extract semantic knowledge
 * 5. Create meaningful chunks
 * 6. Generate embeddings
 * 7. Upload to vector database (Pinecone/Upstash)
 *
 * Usage:
 *   npm run process-transcript
 *   npm run process-transcript -- path/to/custom-transcript.srt
 */

const path = require('path')
const fs = require('fs')
const { processTranscript } = require('../lib/content-pipeline')

// Load environment variables
require('dotenv').config()

async function main() {
  console.log('🚀 Voice Chatbot - Transcript Processing')
  console.log('=' .repeat(80))

  // Get transcript path from command line or use default
  const args = process.argv.slice(2)
  const transcriptPath = args[0] || path.join(__dirname, '../data/transcript.srt')

  // Check if file exists
  if (!fs.existsSync(transcriptPath)) {
    console.error(`\n❌ Transcript file not found: ${transcriptPath}`)
    console.log('\nPlease provide a valid SRT file path or add transcript.srt to backend/data/')
    console.log('\nUsage:')
    console.log('  npm run process-transcript')
    console.log('  npm run process-transcript -- path/to/your-transcript.srt')
    process.exit(1)
  }

  // Check credentials
  console.log('\n📋 Checking credentials:')
  const hasHF = !!(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN)
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasPinecone = !!process.env.PINECONE_API_KEY
  const hasUpstash = !!(process.env.UPSTASH_VECTOR_URL && process.env.UPSTASH_VECTOR_TOKEN)

  console.log(`   Embedding Provider:`)
  console.log(`     - HuggingFace: ${hasHF ? '✓ Configured' : '✗ Not configured'}`)
  console.log(`     - OpenAI: ${hasOpenAI ? '✓ Configured' : '✗ Not configured'}`)
  console.log(`   Vector Database:`)
  console.log(`     - Pinecone: ${hasPinecone ? '✓ Configured' : '✗ Not configured'}`)
  console.log(`     - Upstash: ${hasUpstash ? '✓ Configured' : '✗ Not configured'}`)

  if (!hasHF && !hasOpenAI) {
    console.error('\n❌ No embedding provider configured!')
    console.log('\nPlease add one of the following to your .env file:')
    console.log('  HUGGINGFACE_API_KEY=your_token (recommended, free)')
    console.log('  OPENAI_API_KEY=your_key (paid)')
    console.log('\nGet your free HuggingFace token at: https://huggingface.co/settings/tokens')
    process.exit(1)
  }

  if (!hasPinecone && !hasUpstash) {
    console.error('\n❌ No vector database configured!')
    console.log('\nPlease add one of the following to your .env file:')
    console.log('  PINECONE_API_KEY=your_key (recommended)')
    console.log('  OR')
    console.log('  UPSTASH_VECTOR_URL=your_url')
    console.log('  UPSTASH_VECTOR_TOKEN=your_token')
    console.log('\nGet your Pinecone API key at: https://www.pinecone.io/')
    process.exit(1)
  }

  // Configure pipeline
  const embeddingProvider = hasHF ? 'huggingface' : 'openai'
  const embeddingModel = hasHF ? 'multilingual-e5-base' : 'openai-small'
  const vectorDBProvider = hasPinecone ? 'pinecone' : 'upstash'

  console.log(`\n✓ Pipeline Configuration:`)
  console.log(`   Embedding: ${embeddingProvider} (${embeddingModel})`)
  console.log(`   Vector DB: ${vectorDBProvider}`)
  console.log(`\n📄 Transcript: ${transcriptPath}`)

  // Configure pipeline with progress tracking
  const config = {
    // Embeddings
    embeddingProvider,
    embeddingModel,
    embeddingBatchSize: 100,

    // Vector DB
    vectorDBProvider,
    vectorDBIndexName: 'transcript-knowledge',
    vectorDBNamespace: '',
    vectorDBBatchSize: 100,

    // Cleaning
    removeFillers: false,
    enableErrorCorrection: true,
    normalizeChars: true,
    removeNonVerbal: true,

    // Output
    saveIntermediateResults: true,
    outputDir: path.join(__dirname, '../output'),

    // Progress callback
    onProgress: (progress) => {
      // You can add custom progress tracking here if needed
    }
  }

  console.log(`\n🔄 Starting pipeline...\n`)

  // Run pipeline
  const result = await processTranscript(transcriptPath, config)

  // Display results
  if (result.success) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`✅ PIPELINE SUCCESS!`)
    console.log(`${'='.repeat(80)}`)
    console.log(`\n📊 Final Statistics:`)
    console.log(`   Total Time: ${result.stats.totalTime.toFixed(2)}s`)
    console.log(`\n   Pipeline Flow:`)
    console.log(`     Segments:          ${result.stats.stages.segments}`)
    console.log(`     → Sentences:       ${result.stats.stages.sentences}`)
    console.log(`     → Paragraphs:      ${result.stats.stages.paragraphs}`)
    console.log(`     → Corrections:     ${result.stats.stages.corrections}`)
    console.log(`     → Knowledge:       ${result.stats.stages.knowledgeObjects}`)
    console.log(`     → Chunks:          ${result.stats.stages.chunks}`)
    console.log(`     → Embeddings:      ${result.stats.stages.embeddings}`)
    console.log(`     → Vectors in DB:   ${result.stats.stages.vectorsUploaded}`)
    console.log(`\n   Configuration:`)
    console.log(`     Embedding Model:   ${result.stats.config.embeddingModel}`)
    console.log(`     Provider:          ${result.stats.config.embeddingProvider}`)
    console.log(`     Vector DB:         ${result.stats.config.vectorDBProvider}`)
    console.log(`     Dimensions:        ${result.stats.config.dimensions}`)

    console.log(`\n💾 Output files saved to: ${config.outputDir}`)
    console.log(`\n🎉 Knowledge base updated successfully!`)
    console.log(`\n📌 Next steps:`)
    console.log(`   1. Test the chatbot: npm run test:api`)
    console.log(`   2. Start backend: node server.js`)
    console.log(`   3. Start frontend: cd ../frontend && npm run dev`)
    console.log(`   4. Open browser: http://localhost:5173`)

  } else {
    console.error(`\n${'='.repeat(80)}`)
    console.error(`❌ PIPELINE FAILED!`)
    console.error(`${'='.repeat(80)}`)
    console.error(`   Stage: ${result.error.stage} - ${result.error.stageName}`)
    console.error(`   Error: ${result.error.message}`)
    console.error(`\n   Partial results may be available in: ${config.outputDir}`)
    process.exit(1)
  }

  console.log(`\n${'='.repeat(80)}\n`)
}

// Run script
main().catch(error => {
  console.error('\n❌ Fatal error:')
  console.error(error)
  process.exit(1)
})
