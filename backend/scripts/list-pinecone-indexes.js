/**
 * List All Pinecone Indexes
 *
 * Lists all indexes in your Pinecone account to help verify
 * which index is being used.
 *
 * Usage:
 *   node backend/scripts/list-pinecone-indexes.js
 */

const { Pinecone } = require('@pinecone-database/pinecone')
require('dotenv').config()

async function main() {
  console.log('📋 List All Pinecone Indexes')
  console.log('='.repeat(80))

  // Check credentials
  if (!process.env.PINECONE_API_KEY) {
    console.error('\n❌ PINECONE_API_KEY not found in .env file')
    process.exit(1)
  }

  const configuredIndex = process.env.PINECONE_INDEX_NAME || 'transcript-knowledge'
  console.log(`\n📋 Configured index (from .env or default): ${configuredIndex}`)
  console.log(`   PINECONE_INDEX_NAME: ${process.env.PINECONE_INDEX_NAME || '(not set, using default)'}\n`)

  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    
    console.log('🔍 Fetching all indexes...\n')
    const indexes = await pinecone.listIndexes()

    if (!indexes.indexes || indexes.indexes.length === 0) {
      console.log('⚠️  No indexes found in your Pinecone account.')
      console.log('\n📌 Create an index by processing a transcript:')
      console.log('   npm run process-transcript')
      process.exit(0)
    }

    console.log(`✅ Found ${indexes.indexes.length} index(es):\n`)

    indexes.indexes.forEach((index, idx) => {
      const isConfigured = index.name === configuredIndex
      const marker = isConfigured ? '👉' : '  '
      const status = isConfigured ? '(CURRENTLY CONFIGURED)' : ''
      
      console.log(`${marker} ${idx + 1}. ${index.name} ${status}`)
      
      if (isConfigured) {
        console.log(`     ✅ This is the index your scripts are using!`)
      }
      
      // Get stats for this index
      try {
        const indexInstance = pinecone.index(index.name)
        indexInstance.describeIndexStats().then(stats => {
          const total = stats.totalVectorCount || 0
          console.log(`     📊 Vectors: ${total}`)
          if (stats.namespaces && Object.keys(stats.namespaces).length > 0) {
            console.log(`     📁 Namespaces: ${Object.keys(stats.namespaces).length}`)
            Object.entries(stats.namespaces).forEach(([ns, data]) => {
              console.log(`        - ${ns || '(default)'}: ${data.vectorCount || 0} vectors`)
            })
          }
        }).catch(() => {
          // Ignore errors when getting stats
        })
      } catch (e) {
        // Ignore errors
      }
      
      console.log('')
    })

    // Check if configured index exists
    const configuredExists = indexes.indexes.some(idx => idx.name === configuredIndex)
    
    if (!configuredExists) {
      console.log(`\n⚠️  WARNING: Configured index "${configuredIndex}" does NOT exist!`)
      console.log(`\n📌 Options:`)
      console.log(`   1. Create the index by processing a transcript:`)
      console.log(`      npm run process-transcript`)
      console.log(`\n   2. Or update PINECONE_INDEX_NAME in .env to use an existing index:`)
      indexes.indexes.forEach(idx => {
        console.log(`      PINECONE_INDEX_NAME=${idx.name}`)
      })
    } else {
      console.log(`\n✅ Configured index "${configuredIndex}" exists and is ready to use!`)
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    console.error(error)
    process.exit(1)
  }

  console.log(`\n${'='.repeat(80)}\n`)
}

main()







