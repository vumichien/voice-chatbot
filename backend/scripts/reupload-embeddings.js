/**
 * Re-upload Embeddings to Pinecone
 *
 * Uploads previously generated embeddings from saved JSON file to Pinecone.
 * Useful when you need to re-upload without re-processing the entire pipeline.
 *
 * Usage:
 *   node backend/scripts/reupload-embeddings.js
 *   node backend/scripts/reupload-embeddings.js path/to/embeddings.json
 *   node backend/scripts/reupload-embeddings.js path/to/embeddings.json custom-namespace
 */

const fs = require('fs').promises
const path = require('path')
const { uploadVectors } = require('../lib/vectordb')
require('dotenv').config()

async function main() {
  console.log('📤 Re-upload Embeddings to Pinecone')
  console.log('=' .repeat(80))

  // Get embeddings file path from command line or use default
  const args = process.argv.slice(2)
  const embeddingsPath = args[0] || path.join(__dirname, '../output/06-embeddings.json')
  const namespace = args[1] || ''

  console.log(`\n📄 Embeddings file: ${embeddingsPath}`)
  console.log(`📋 Namespace: ${namespace || '(default)'}`)

  // Check credentials
  if (!process.env.PINECONE_API_KEY) {
    console.error('\n❌ PINECONE_API_KEY not found in .env file')
    console.log('\nPlease add your Pinecone API key to the .env file:')
    console.log('  PINECONE_API_KEY=your_api_key_here')
    process.exit(1)
  }

  try {
    // Check if file exists
    try {
      await fs.access(embeddingsPath)
    } catch {
      console.error(`\n❌ Embeddings file not found: ${embeddingsPath}`)
      console.log('\nPlease provide a valid path to an embeddings JSON file:')
      console.log('  node backend/scripts/reupload-embeddings.js path/to/06-embeddings.json')
      console.log('\nOr generate new embeddings by processing a transcript:')
      console.log('  npm run process-transcript')
      process.exit(1)
    }

    // Read embeddings file
    console.log(`\n📖 Reading embeddings file...`)
    const data = await fs.readFile(embeddingsPath, 'utf-8')
    const embeddings = JSON.parse(data)

    // Validate embeddings data
    if (!embeddings.chunks || !Array.isArray(embeddings.chunks)) {
      console.error(`\n❌ Invalid embeddings file format`)
      console.log('\nThe file should contain a "chunks" array with embeddings.')
      console.log('Make sure you are using the output from the pipeline (06-embeddings.json)')
      process.exit(1)
    }

    console.log(`✓ Loaded ${embeddings.chunks.length} embeddings`)
    console.log(`✓ Model: ${embeddings.stats?.model || 'unknown'}`)
    console.log(`✓ Dimensions: ${embeddings.stats?.totalDimensions || 'unknown'}`)

    // Upload to Pinecone
    console.log(`\n📤 Uploading to Pinecone...`)
    const result = await uploadVectors(embeddings, {
      provider: 'pinecone',
      indexName: 'transcript-knowledge',
      namespace: namespace,
      transcriptFile: embeddings.metadata?.transcriptFile || 'transcript.srt',
      batchSize: 100
    })

    if (result.success) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`✅ RE-UPLOAD COMPLETE!`)
      console.log(`${'='.repeat(80)}`)
      console.log(`\n📊 Statistics:`)
      console.log(`   Vectors uploaded: ${result.stats.totalVectors}`)
      console.log(`   Upload time: ${result.stats.uploadTime.toFixed(2)}s`)
      console.log(`   Index: ${result.stats.indexName}`)
      console.log(`   Namespace: ${result.stats.namespace || '(default)'}`)
      console.log(`   Provider: ${result.stats.provider}`)

      console.log(`\n✅ Knowledge base updated successfully!`)
      console.log(`\n📌 Next steps:`)
      console.log(`   1. Test the API: npm run test:api`)
      console.log(`   2. Start backend: node server.js`)
      console.log(`   3. Start frontend: cd ../frontend && npm run dev`)
    } else {
      console.error(`\n❌ Upload failed`)
      process.exit(1)
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    console.error(error)
    process.exit(1)
  }

  console.log(`\n${'='.repeat(80)}\n`)
}

main()
