/**
 * End-to-End Pipeline Test
 *
 * Tests the complete 7-stage content processing pipeline with real transcript data.
 */

const path = require('path')
const { processTranscript } = require('../lib/content-pipeline')

// Load environment variables
require('dotenv').config()

async function main() {
  console.log('🚀 End-to-End Pipeline Test')
  console.log('=' .repeat(80))

  // Check credentials
  console.log('\n📋 Checking credentials:')
  const hasHF = !!(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN)
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasPinecone = !!process.env.PINECONE_API_KEY
  const hasUpstash = !!(process.env.UPSTASH_VECTOR_URL && process.env.UPSTASH_VECTOR_TOKEN)

  console.log(`   Embedding Provider:`)
  console.log(`     - HuggingFace: ${hasHF ? '✓' : '✗'}`)
  console.log(`     - OpenAI: ${hasOpenAI ? '✓' : '✗'}`)
  console.log(`   Vector DB:`)
  console.log(`     - Pinecone: ${hasPinecone ? '✓' : '✗'}`)
  console.log(`     - Upstash: ${hasUpstash ? '✓' : '✗'}`)

  if (!hasHF && !hasOpenAI) {
    console.error('\n❌ No embedding provider configured!')
    console.log('\nPlease add one of the following to your .env file:')
    console.log('  HUGGINGFACE_API_KEY=your_token (recommended, free)')
    console.log('  OPENAI_API_KEY=your_key')
    process.exit(1)
  }

  if (!hasPinecone && !hasUpstash) {
    console.error('\n❌ No vector database configured!')
    console.log('\nPlease add one of the following to your .env file:')
    console.log('  PINECONE_API_KEY=your_key (recommended)')
    console.log('  OR')
    console.log('  UPSTASH_VECTOR_URL=your_url')
    console.log('  UPSTASH_VECTOR_TOKEN=your_token')
    process.exit(1)
  }

  // Configure pipeline
  const embeddingProvider = hasHF ? 'huggingface' : 'openai'
  const embeddingModel = hasHF ? 'multilingual-e5-base' : 'openai-small'
  const vectorDBProvider = hasPinecone ? 'pinecone' : 'upstash'

  console.log(`\n✓ Pipeline Configuration:`)
  console.log(`   Embedding: ${embeddingProvider} (${embeddingModel})`)
  console.log(`   Vector DB: ${vectorDBProvider}`)

  // Prepare transcript path
  const transcriptPath = path.join(__dirname, '../../data/transcript.srt')
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
    outputDir: path.join(__dirname, '../output/pipeline'),

    // Progress callback
    onProgress: (progress) => {
      // Optional: detailed progress tracking
      // console.log(`[${progress.percentage}%] Stage ${progress.stage}/${progress.totalStages}: ${progress.stageName}`)
    }
  }

  console.log(`\n🔄 Starting pipeline...\n`)

  // Run pipeline
  const startTime = Date.now()
  const result = await processTranscript(transcriptPath, config)
  const endTime = Date.now()

  // Display results
  if (result.success) {
    console.log(`\n✅ PIPELINE SUCCESS!`)
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

    console.log(`\n💾 Intermediate files saved to: ${config.outputDir}`)
    console.log(`\n🎉 Your chatbot is ready! The knowledge is now in the vector database.`)
    console.log(`\n📌 Next steps:`)
    console.log(`   1. Implement RAG query pipeline (Task 10)`)
    console.log(`   2. Create chat API endpoint (Task 11)`)
    console.log(`   3. Build frontend interface (Tasks F01-F09)`)

  } else {
    console.error(`\n❌ PIPELINE FAILED!`)
    console.error(`   Stage: ${result.error.stage} - ${result.error.stageName}`)
    console.error(`   Error: ${result.error.message}`)
    console.error(`\n   Partial results may be available in: ${config.outputDir}`)
  }

  console.log(`\n${'='.repeat(80)}\n`)
}

// Run test
main().catch(error => {
  console.error('\n❌ Fatal error:')
  console.error(error)
  process.exit(1)
})
