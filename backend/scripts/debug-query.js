/**
 * Debug Query - Check what the RAG system is retrieving
 */

const { searchVectors } = require('../lib/vectordb')
const { generateEmbedding } = require('../lib/embeddings')
require('dotenv').config()

async function debugQuery(question) {
  console.log('\n🔍 Debug Query Tool')
  console.log('='.repeat(80))
  console.log(`Question: ${question}`)
  console.log('='.repeat(80))

  // Step 1: Generate embedding
  console.log('\n[Step 1] Generating query embedding...')
  const queryEmbedding = await generateEmbedding(question, {
    provider: 'huggingface',
    model: 'multilingual-e5-base'
  })
  console.log(`✓ Generated embedding (${queryEmbedding.length} dimensions)`)

  // Step 2: Search vector DB
  console.log('\n[Step 2] Searching vector database...')
  const searchResults = await searchVectors(queryEmbedding, {
    provider: 'pinecone',
    indexName: 'transcript-knowledge',
    namespace: '',
    topK: 5
  })

  console.log(`✓ Found ${searchResults.length} results\n`)

  // Step 3: Display results
  if (searchResults.length === 0) {
    console.log('❌ No results found! Vector DB might be empty.')
    console.log('\nRun this to populate the database:')
    console.log('  node scripts/test-pipeline.js')
    return
  }

  console.log('📚 Retrieved Sources:\n')
  searchResults.forEach((result, idx) => {
    console.log(`Source ${idx + 1}:`)
    console.log(`  Topic: ${result.metadata.topic}`)
    console.log(`  Timestamp: ${result.metadata.timestamp}`)
    console.log(`  Score: ${result.score.toFixed(4)}`)
    console.log(`  Content: ${result.metadata.content.substring(0, 200)}...`)
    console.log()
  })

  // Step 4: Show what would be sent to LLM
  const context = searchResults
    .map((result, idx) => {
      return `[ソース ${idx + 1}] ${result.metadata.content}\n(時間: ${result.metadata.timestamp})`
    })
    .join('\n\n')

  console.log('='.repeat(80))
  console.log('📝 Context sent to LLM:')
  console.log('='.repeat(80))
  console.log(context)
  console.log('\n' + '='.repeat(80))
}

// Test question
const question = process.argv[2] || '青木さんが29歳の時に出会ったものは何ですか？'

debugQuery(question).catch(error => {
  console.error('\n❌ Error:', error.message)
  process.exit(1)
})
