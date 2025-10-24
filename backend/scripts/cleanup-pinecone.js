/**
 * Cleanup Pinecone Database
 *
 * Deletes vectors from Pinecone index.
 * Use this to clear old data before uploading new transcripts.
 *
 * Usage:
 *   node backend/scripts/cleanup-pinecone.js [namespace]
 *   node backend/scripts/cleanup-pinecone.js              # Delete all from default namespace
 *   node backend/scripts/cleanup-pinecone.js lecture-2024 # Delete from specific namespace
 */

const { Pinecone } = require('@pinecone-database/pinecone')
const readline = require('readline')
require('dotenv').config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('🗑️  Pinecone Cleanup Tool')
  console.log('=' .repeat(80))

  // Check credentials
  if (!process.env.PINECONE_API_KEY) {
    console.error('\n❌ PINECONE_API_KEY not found in .env file')
    console.log('\nPlease add your Pinecone API key to the .env file:')
    console.log('  PINECONE_API_KEY=your_api_key_here')
    process.exit(1)
  }

  // Get namespace from command line
  const namespace = process.argv[2] || ''
  const indexName = 'transcript-knowledge'

  console.log(`\n📋 Configuration:`)
  console.log(`   Index: ${indexName}`)
  console.log(`   Namespace: ${namespace || '(default)'}`)

  // Initialize Pinecone
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
  const index = pinecone.index(indexName)

  // Get current stats
  console.log(`\n📊 Checking current index stats...`)
  try {
    const stats = await index.describeIndexStats()
    console.log(`\n   Current vectors:`)
    if (stats.namespaces) {
      Object.entries(stats.namespaces).forEach(([ns, data]) => {
        console.log(`     ${ns || '(default)'}: ${data.vectorCount} vectors`)
      })
    } else {
      console.log(`     Total: ${stats.totalVectorCount || 0} vectors`)
    }

    // Confirm deletion
    console.log(`\n⚠️  WARNING: This will permanently delete all vectors from:`)
    console.log(`   Index: ${indexName}`)
    console.log(`   Namespace: ${namespace || '(default)'}`)
    console.log(`\n   This action CANNOT be undone!`)

    const answer = await question('\n   Type "DELETE" to confirm: ')

    if (answer.trim() !== 'DELETE') {
      console.log('\n❌ Deletion cancelled.')
      rl.close()
      process.exit(0)
    }

    // Delete vectors
    console.log(`\n🗑️  Deleting vectors...`)
    await index.namespace(namespace).deleteAll()

    console.log(`\n✅ Successfully deleted all vectors from namespace: ${namespace || '(default)'}`)

    // Check stats again
    console.log(`\n📊 Checking updated stats...`)
    const newStats = await index.describeIndexStats()
    console.log(`\n   Remaining vectors:`)
    if (newStats.namespaces) {
      Object.entries(newStats.namespaces).forEach(([ns, data]) => {
        console.log(`     ${ns || '(default)'}: ${data.vectorCount} vectors`)
      })
    } else {
      console.log(`     Total: ${newStats.totalVectorCount || 0} vectors`)
    }

    console.log(`\n✅ Cleanup complete! You can now upload new transcript data.`)
    console.log(`\n📌 Next steps:`)
    console.log(`   1. Process new transcript: npm run process-transcript`)
    console.log(`   2. Or process custom file: npm run process-transcript -- path/to/file.srt`)

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    console.error(error)
    process.exit(1)
  }

  rl.close()
  console.log(`\n${'='.repeat(80)}\n`)
}

main()
