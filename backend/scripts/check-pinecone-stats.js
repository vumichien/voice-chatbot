ye/**
 * Check Pinecone Index Statistics
 *
 * Displays information about your Pinecone index including:
 * - Total vector count
 * - Vectors per namespace
 * - Index configuration
 *
 * Usage:
 *   node backend/scripts/check-pinecone-stats.js
 */

const { getIndexStats } = require('../lib/vectordb')
require('dotenv').config()

async function main() {
  console.log('📊 Pinecone Index Statistics')
  console.log('=' .repeat(80))

  // Check credentials
  if (!process.env.PINECONE_API_KEY) {
    console.error('\n❌ PINECONE_API_KEY not found in .env file')
    console.log('\nPlease add your Pinecone API key to the .env file:')
    console.log('  PINECONE_API_KEY=your_api_key_here')
    process.exit(1)
  }

  const indexName = 'transcript-knowledge'
  console.log(`\n📋 Index: ${indexName}\n`)

  try {
    const stats = await getIndexStats({
      provider: 'pinecone',
      indexName: indexName
    })

    console.log('📈 Statistics:')
    console.log(`   Total Vectors: ${stats.totalVectorCount || 0}`)
    console.log(`   Dimension: ${stats.dimension || 'N/A'}`)

    if (stats.namespaces && Object.keys(stats.namespaces).length > 0) {
      console.log(`\n📁 Namespaces:`)
      Object.entries(stats.namespaces).forEach(([namespace, data]) => {
        const ns = namespace || '(default)'
        console.log(`\n   ${ns}:`)
        console.log(`     Vectors: ${data.vectorCount}`)
      })
    } else {
      console.log(`\n📁 Namespaces: None (using default namespace)`)
    }

    // Index fullness (if available)
    if (stats.indexFullness !== undefined) {
      const fullnessPercent = (stats.indexFullness * 100).toFixed(2)
      console.log(`\n💾 Index Fullness: ${fullnessPercent}%`)
    }

    console.log(`\n✅ Statistics retrieved successfully!`)

    // Provide helpful context
    if (stats.totalVectorCount === 0) {
      console.log(`\n⚠️  No vectors found in the index.`)
      console.log(`\n📌 To add data:`)
      console.log(`   1. Place your transcript.srt file in backend/data/`)
      console.log(`   2. Run: npm run process-transcript`)
    } else {
      console.log(`\n📌 Index is populated and ready for queries!`)
      console.log(`\n   Test the chatbot:`)
      console.log(`   1. Start backend: node server.js`)
      console.log(`   2. Start frontend: cd frontend && npm run dev`)
      console.log(`   3. Open browser: http://localhost:5173`)
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)

    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      console.log(`\n💡 The index "${indexName}" doesn't exist yet.`)
      console.log(`\n   It will be created automatically when you process your first transcript:`)
      console.log(`   npm run process-transcript`)
    } else {
      console.error(error)
    }

    process.exit(1)
  }

  console.log(`\n${'='.repeat(80)}\n`)
}

main()
