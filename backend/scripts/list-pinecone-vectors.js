/**
 * List Sample Vectors from Pinecone
 *
 * Fetches and displays sample vectors from your Pinecone index.
 * Useful for debugging and verifying data quality.
 *
 * Usage:
 *   node backend/scripts/list-pinecone-vectors.js
 *   node backend/scripts/list-pinecone-vectors.js --namespace my-namespace
 *   node backend/scripts/list-pinecone-vectors.js --limit 10
 */

const { Pinecone } = require('@pinecone-database/pinecone')
require('dotenv').config()

async function main() {
  console.log('📋 List Pinecone Vectors')
  console.log('='.repeat(80))

  // Check credentials
  if (!process.env.PINECONE_API_KEY) {
    console.error('\n❌ PINECONE_API_KEY not found in .env file')
    process.exit(1)
  }

  // Parse arguments
  const args = process.argv.slice(2)
  const namespaceIndex = args.indexOf('--namespace')
  const namespace = namespaceIndex >= 0 && args[namespaceIndex + 1] 
    ? args[namespaceIndex + 1] 
    : ''
  
  const limitIndex = args.indexOf('--limit')
  const limit = limitIndex >= 0 && args[limitIndex + 1]
    ? parseInt(args[limitIndex + 1], 10)
    : 5

  const indexName = process.env.PINECONE_INDEX_NAME || 'transcript-knowledge'

  console.log(`\n📋 Configuration:`)
  console.log(`   Index: ${indexName}`)
  console.log(`   Namespace: ${namespace || '(default)'}`)
  console.log(`   Limit: ${limit} vectors`)

  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    const index = pinecone.index(indexName)

    // Get stats first
    // Note: Pinecone uses 'recordCount' for the number of vectors/records
    const stats = await index.describeIndexStats()
    const namespaceStats = namespace 
      ? stats.namespaces?.[namespace] 
      : stats.namespaces?.[''] || { recordCount: stats.totalVectorCount || 0 }

    // Pinecone returns recordCount, not vectorCount
    const vectorCount = namespaceStats.recordCount || namespaceStats.vectorCount || 0
    console.log(`\n📊 Total vectors in namespace: ${vectorCount}`)

    if (vectorCount === 0) {
      console.log(`\n⚠️  No vectors found in this namespace.`)
      console.log(`\n📌 To add data:`)
      console.log(`   npm run update-knowledge -- --cleanup`)
      process.exit(0)
    }

    // Query with a dummy vector to get sample results
    // We'll use a zero vector of the correct dimension
    const dimension = stats.dimension || 768
    const dummyVector = new Array(dimension).fill(0)

    console.log(`\n🔍 Fetching sample vectors...`)

    const queryResult = await index.namespace(namespace).query({
      vector: dummyVector,
      topK: Math.min(limit, vectorCount),
      includeMetadata: true
    })

    if (!queryResult.matches || queryResult.matches.length === 0) {
      console.log(`\n⚠️  No vectors returned from query.`)
      process.exit(0)
    }

    console.log(`\n✅ Retrieved ${queryResult.matches.length} sample vectors:\n`)

    queryResult.matches.forEach((match, index) => {
      console.log(`${'─'.repeat(80)}`)
      console.log(`\n📌 Vector #${index + 1}:`)
      console.log(`   ID: ${match.id}`)
      console.log(`   Score: ${match.score?.toFixed(4) || 'N/A'}`)
      
      if (match.metadata) {
        console.log(`\n   Metadata:`)
        if (match.metadata.content) {
          const content = match.metadata.content
          const preview = content.length > 150 ? content.substring(0, 150) + '...' : content
          console.log(`     Content: ${preview}`)
        }
        if (match.metadata.topic) {
          console.log(`     Topic: ${match.metadata.topic}`)
        }
        if (match.metadata.importance) {
          console.log(`     Importance: ${match.metadata.importance}`)
        }
        if (match.metadata.category) {
          console.log(`     Category: ${match.metadata.category}`)
        }
        if (match.metadata.timestamp) {
          console.log(`     Timestamp: ${match.metadata.timestamp}`)
        }
        if (match.metadata.people) {
          console.log(`     People: ${match.metadata.people}`)
        }
        if (match.metadata.concepts) {
          console.log(`     Concepts: ${match.metadata.concepts}`)
        }
        if (match.metadata.keywords) {
          console.log(`     Keywords: ${match.metadata.keywords}`)
        }
        if (match.metadata.uploadDate) {
          console.log(`     Upload Date: ${match.metadata.uploadDate}`)
        }
      }
    })

    console.log(`\n${'─'.repeat(80)}`)
    console.log(`\n✅ Displayed ${queryResult.matches.length} sample vectors`)
    console.log(`\n💡 Tip: Use --limit N to see more vectors (default: 5)`)

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    
    if (error.message.includes('not found') || error.message.includes('does not exist')) {
      console.log(`\n💡 The index "${indexName}" doesn't exist yet.`)
      console.log(`\n   Create it by processing a transcript:`)
      console.log(`   npm run process-transcript`)
    } else {
      console.error(error)
    }
    
    process.exit(1)
  }

  console.log(`\n${'='.repeat(80)}\n`)
}

main()

