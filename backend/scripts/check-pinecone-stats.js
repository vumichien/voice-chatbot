/**
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

  const indexName = process.env.PINECONE_INDEX_NAME || 'transcript-knowledge'
  console.log(`\n📋 Index: ${indexName}`)
  console.log(`   (Using: ${process.env.PINECONE_INDEX_NAME ? 'PINECONE_INDEX_NAME from .env' : 'default: transcript-knowledge'})\n`)

  try {
    const stats = await getIndexStats({
      provider: 'pinecone',
      indexName: indexName
    })

    console.log('📈 Statistics:')
    console.log(`   Dimension: ${stats.dimension || 'N/A'}`)

    // Calculate total from namespaces first (more accurate)
    // Note: Pinecone uses 'recordCount' for the number of vectors/records
    let totalFromNamespaces = 0
    let hasNamespaceData = false
    
    if (stats.namespaces && Object.keys(stats.namespaces).length > 0) {
      hasNamespaceData = true
      console.log(`\n📁 Namespaces:`)
      Object.entries(stats.namespaces).forEach(([namespace, data]) => {
        // Handle different namespace names (empty string = default namespace)
        const ns = namespace === '' ? '(default)' : namespace
        
        // Pinecone returns recordCount (not vectorCount) for the number of vectors
        let vectorCount = 0
        if (typeof data === 'object' && data !== null) {
          // Try recordCount first (Pinecone's actual field), then vectorCount as fallback
          vectorCount = data.recordCount || data.vectorCount || 0
        } else if (typeof data === 'number') {
          vectorCount = data
        }
        
        totalFromNamespaces += vectorCount
        const status = vectorCount > 0 ? '✅' : '⚠️'
        console.log(`\n   ${status} ${ns}:`)
        console.log(`     Vectors: ${vectorCount}`)
      })
    } else {
      console.log(`\n📁 Namespaces: None (using default namespace)`)
    }

    // Get totalVectorCount as fallback
    const totalVectorsFromAPI = stats.totalVectorCount || 0
    
    // Use namespace total if available (more accurate), otherwise use API total
    const actualTotal = hasNamespaceData ? totalFromNamespaces : totalVectorsFromAPI
    
    // Display the accurate total
    console.log(`\n📊 Total Vectors: ${actualTotal}`)
    if (hasNamespaceData && totalVectorsFromAPI !== totalFromNamespaces) {
      console.log(`   (Note: API reports ${totalVectorsFromAPI}, but namespace data shows ${totalFromNamespaces})`)
    }

    // Index fullness (if available)
    if (stats.indexFullness !== undefined) {
      const fullnessPercent = (stats.indexFullness * 100).toFixed(2)
      console.log(`\n💾 Index Fullness: ${fullnessPercent}%`)
    }

    console.log(`\n✅ Statistics retrieved successfully!`)

    // Provide helpful context
    if (actualTotal === 0) {
      console.log(`\n⚠️  ⚠️  ⚠️  KHÔNG CÓ DỮ LIỆU TRONG DATABASE! ⚠️  ⚠️  ⚠️`)
      console.log(`\n📌 Để thêm dữ liệu, bạn có thể:`)
      console.log(`\n   Cách 1: Cập nhật từ knowledge.json (Khuyến nghị)`)
      console.log(`   npm run update-knowledge -- --cleanup`)
      console.log(`\n   Cách 2: Xử lý transcript mới`)
      console.log(`   1. Đặt file transcript.srt vào backend/data/`)
      console.log(`   2. Chạy: npm run process-transcript`)
    } else {
      console.log(`\n✅ Index có ${actualTotal} vectors và sẵn sàng cho queries!`)
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
