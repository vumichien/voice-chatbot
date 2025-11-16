/**
 * Process Transcript with Custom Namespace
 *
 * Runs the 7-stage pipeline and uploads to a specific Pinecone namespace.
 * Useful for organizing multiple transcripts or topics separately.
 *
 * Usage:
 *   node backend/scripts/process-with-namespace.js <transcript-file> <namespace>
 *   node backend/scripts/process-with-namespace.js data/lecture1.srt lecture-2024-01
 *   node backend/scripts/process-with-namespace.js data/ai-course.srt topic-ai
 */

const path = require('path')
const fs = require('fs')
const { processTranscript } = require('../lib/content-pipeline')
require('dotenv').config()

async function main() {
  console.log('🚀 Process Transcript with Namespace')
  console.log('=' .repeat(80))

  // Get arguments
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.log('\n📋 Usage:')
    console.log('  node backend/scripts/process-with-namespace.js <transcript-file> <namespace>')
    console.log('\n📝 Examples:')
    console.log('  node backend/scripts/process-with-namespace.js data/lecture1.srt lecture-2024-01')
    console.log('  node backend/scripts/process-with-namespace.js data/ai-basics.srt topic-ai')
    console.log('  node backend/scripts/process-with-namespace.js ../videos/course.srt course-intro')
    console.log('\n💡 Namespaces help organize different transcripts in the same Pinecone index.')
    console.log('   You can query specific namespaces later in your chat API.')
    process.exit(1)
  }

  const transcriptPath = args[0]
  const namespace = args[1]

  // Validate transcript file
  if (!fs.existsSync(transcriptPath)) {
    console.error(`\n❌ Transcript file not found: ${transcriptPath}`)
    console.log('\nPlease provide a valid SRT file path.')
    process.exit(1)
  }

  // Validate namespace
  if (!namespace || namespace.trim() === '') {
    console.error(`\n❌ Namespace cannot be empty`)
    console.log('\nPlease provide a valid namespace name (e.g., "lecture-2024-01")')
    process.exit(1)
  }

  console.log(`\n📄 Transcript: ${transcriptPath}`)
  console.log(`📁 Namespace: ${namespace}`)

  // Check credentials
  const hasHF = !!(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN)
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasPinecone = !!process.env.PINECONE_API_KEY

  if (!hasHF && !hasOpenAI) {
    console.error('\n❌ No embedding provider configured!')
    console.log('\nPlease add to your .env file:')
    console.log('  HUGGINGFACE_API_KEY=your_token (recommended, free)')
    process.exit(1)
  }

  if (!hasPinecone) {
    console.error('\n❌ PINECONE_API_KEY not configured!')
    console.log('\nThis script requires Pinecone. Add to your .env file:')
    console.log('  PINECONE_API_KEY=your_api_key')
    process.exit(1)
  }

  // Configure pipeline
  const embeddingProvider = hasHF ? 'huggingface' : 'openai'
  const embeddingModel = hasHF ? 'ibm-granite' : 'openai-small'

  console.log(`\n✓ Configuration:`)
  console.log(`   Embedding: ${embeddingProvider} (${embeddingModel})`)
  console.log(`   Vector DB: Pinecone`)
  console.log(`   Index: transcript-knowledge`)
  console.log(`   Namespace: ${namespace}`)

  const config = {
    // Embeddings
    embeddingProvider,
    embeddingModel,
    embeddingBatchSize: 100,

    // Vector DB with custom namespace
    vectorDBProvider: 'pinecone',
    vectorDBIndexName: 'transcript-knowledge',
    vectorDBNamespace: namespace,
    vectorDBBatchSize: 100,

    // Cleaning
    removeFillers: false,
    enableErrorCorrection: true,
    normalizeChars: true,
    removeNonVerbal: true,

    // Output (save to namespace-specific folder)
    saveIntermediateResults: true,
    outputDir: path.join(__dirname, `../output/${namespace}`),
  }

  console.log(`\n🔄 Starting pipeline...\n`)

  // Run pipeline
  const result = await processTranscript(transcriptPath, config)

  // Display results
  if (result.success) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`✅ PIPELINE SUCCESS!`)
    console.log(`${'='.repeat(80)}`)
    console.log(`\n📊 Statistics:`)
    console.log(`   Time: ${result.stats.totalTime.toFixed(2)}s`)
    console.log(`   Vectors uploaded: ${result.stats.stages.vectorsUploaded}`)
    console.log(`   Namespace: ${namespace}`)
    console.log(`   Knowledge objects: ${result.stats.stages.knowledgeObjects}`)
    console.log(`   Chunks: ${result.stats.stages.chunks}`)

    console.log(`\n💾 Output saved to: ${config.outputDir}`)

    console.log(`\n✅ Transcript uploaded to namespace: ${namespace}`)
    console.log(`\n📌 To query this namespace in your API:`)
    console.log(`\n   const results = await searchVectors(queryEmbedding, {`)
    console.log(`     provider: 'pinecone',`)
    console.log(`     indexName: 'transcript-knowledge',`)
    console.log(`     namespace: '${namespace}',`)
    console.log(`     topK: 5`)
    console.log(`   })`)

    console.log(`\n📌 To process more transcripts:`)
    console.log(`   node backend/scripts/process-with-namespace.js data/another.srt another-namespace`)

  } else {
    console.error(`\n${'='.repeat(80)}`)
    console.error(`❌ PIPELINE FAILED!`)
    console.error(`${'='.repeat(80)}`)
    console.error(`   Stage: ${result.error.stage} - ${result.error.stageName}`)
    console.error(`   Error: ${result.error.message}`)
    process.exit(1)
  }

  console.log(`\n${'='.repeat(80)}\n`)
}

main().catch(error => {
  console.error('\n❌ Fatal error:')
  console.error(error)
  process.exit(1)
})
