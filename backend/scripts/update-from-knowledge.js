/**
 * Update Vector Database from knowledge.json
 *
 * This script:
 * 1. Reads knowledge.json file
 * 2. Converts knowledge objects to semantic chunks
 * 3. Generates embeddings for chunks
 * 4. Optionally deletes old data from Pinecone
 * 5. Uploads new embeddings to vector database
 *
 * Usage:
 *   node backend/scripts/update-from-knowledge.js
 *   node backend/scripts/update-from-knowledge.js path/to/knowledge.json
 *   node backend/scripts/update-from-knowledge.js path/to/knowledge.json --cleanup
 *   node backend/scripts/update-from-knowledge.js path/to/knowledge.json --cleanup --namespace custom-ns
 */

const fs = require('fs').promises
const path = require('path')
const readline = require('readline')
const { createSemanticChunks } = require('../lib/semantic-chunker')
const { generateEmbeddings } = require('../lib/embeddings')
const { uploadVectors, deleteVectors, getIndexStats } = require('../lib/vectordb')
require('dotenv').config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

/**
 * Delete all vectors from namespace
 */
async function cleanupNamespace(indexName, namespace, provider) {
  console.log(`\n🗑️  Cleaning up old data...`)
  console.log(`   Index: ${indexName}`)
  console.log(`   Namespace: ${namespace || '(default)'}`)
  console.log(`   Provider: ${provider}`)

  if (provider === 'pinecone') {
    const { Pinecone } = require('@pinecone-database/pinecone')
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY })
    const index = pinecone.index(indexName)
    
    // Get current stats
    const stats = await index.describeIndexStats()
    const namespaceStats = namespace 
      ? stats.namespaces?.[namespace] 
      : stats.namespaces?.[''] || { vectorCount: stats.totalVectorCount || 0 }
    
    if (namespaceStats.vectorCount === 0) {
      console.log(`   ✓ No vectors to delete`)
      return
    }

    console.log(`   Found ${namespaceStats.vectorCount} vectors to delete`)
    
    // Delete all vectors in namespace
    await index.namespace(namespace).deleteAll()
    console.log(`   ✅ Deleted all vectors from namespace`)
  } else {
    console.log(`   ⚠️  Cleanup for ${provider} not yet implemented`)
  }
}

async function main() {
  console.log('🔄 Update Vector Database from knowledge.json')
  console.log('='.repeat(80))

  // Parse command line arguments
  const args = process.argv.slice(2)
  
  // Filter out flags and their values
  const flags = new Set(['--cleanup', '--namespace'])
  const nonFlagArgs = []
  let i = 0
  while (i < args.length) {
    if (flags.has(args[i])) {
      // Skip the flag and its value (if any)
      if (args[i] === '--namespace' && i + 1 < args.length) {
        i += 2 // Skip --namespace and its value
      } else {
        i += 1 // Skip just the flag
      }
    } else {
      nonFlagArgs.push(args[i])
      i += 1
    }
  }
  
  // Knowledge file path is the first non-flag argument, or default
  const knowledgePath = nonFlagArgs[0] || path.join(__dirname, '../data/processed/knowledge.json')
  const shouldCleanup = args.includes('--cleanup')
  const namespaceIndex = args.indexOf('--namespace')
  const namespace = namespaceIndex >= 0 && namespaceIndex + 1 < args.length && !args[namespaceIndex + 1].startsWith('--')
    ? args[namespaceIndex + 1] 
    : ''

  // Configuration
  const indexName = process.env.PINECONE_INDEX_NAME || 'transcript-knowledge'
  const provider = process.env.VECTORDB_PROVIDER || 'pinecone'
  const embeddingProvider = process.env.EMBEDDING_PROVIDER || 'huggingface'
  const embeddingModel = process.env.EMBEDDING_MODEL || 'ibm-granite'

  console.log(`\n📋 Configuration:`)
  console.log(`   Knowledge file: ${knowledgePath}`)
  console.log(`   Vector DB: ${provider}`)
  console.log(`   Index: ${indexName}`)
  console.log(`   Namespace: ${namespace || '(default)'}`)
  console.log(`   Embedding: ${embeddingProvider} (${embeddingModel})`)
  console.log(`   Cleanup old data: ${shouldCleanup ? 'Yes' : 'No'}`)

  // Check credentials
  if (provider === 'pinecone' && !process.env.PINECONE_API_KEY) {
    console.error('\n❌ PINECONE_API_KEY not found in .env file')
    process.exit(1)
  }

  const hasHF = !!(process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN)
  const hasOpenAI = !!process.env.OPENAI_API_KEY

  if (embeddingProvider === 'huggingface' && !hasHF) {
    console.error('\n❌ HUGGINGFACE_API_KEY or HF_TOKEN not found in .env file')
    process.exit(1)
  }

  if (embeddingProvider === 'openai' && !hasOpenAI) {
    console.error('\n❌ OPENAI_API_KEY not found in .env file')
    process.exit(1)
  }

  try {
    // Step 1: Read knowledge.json
    console.log(`\n📖 Step 1: Reading knowledge.json...`)
    const knowledgeData = JSON.parse(await fs.readFile(knowledgePath, 'utf-8'))
    
    if (!knowledgeData.knowledge || !Array.isArray(knowledgeData.knowledge)) {
      throw new Error('Invalid knowledge.json format. Expected { knowledge: [...] }')
    }

    console.log(`   ✓ Loaded ${knowledgeData.knowledge.length} knowledge objects`)
    console.log(`   • High importance: ${knowledgeData.stats?.highImportance || 0}`)
    console.log(`   • Medium importance: ${knowledgeData.stats?.mediumImportance || 0}`)
    console.log(`   • Low importance: ${knowledgeData.stats?.lowImportance || 0}`)

    // Step 2: Convert knowledge to chunks
    console.log(`\n🔨 Step 2: Converting knowledge to semantic chunks...`)
    const chunksData = createSemanticChunks(knowledgeData, {
      minChunkSize: 200,
      maxChunkSize: 1000,
      includeContext: true
    })

    console.log(`   ✓ Created ${chunksData.chunks.length} chunks`)
    console.log(`   • Average size: ${chunksData.stats.avgChunkSize} chars`)
    console.log(`   • Size distribution:`)
    console.log(`     - Small (<400): ${chunksData.stats.sizeDistribution.small}`)
    console.log(`     - Medium (400-700): ${chunksData.stats.sizeDistribution.medium}`)
    console.log(`     - Large (>700): ${chunksData.stats.sizeDistribution.large}`)

    // Step 3: Generate embeddings
    console.log(`\n🧮 Step 3: Generating embeddings...`)
    const embeddingsData = await generateEmbeddings(chunksData, {
      provider: embeddingProvider,
      model: embeddingModel,
      batchSize: 100,
      onProgress: (progress) => {
        process.stdout.write(`\r   Progress: ${progress.percentage}% (${progress.processed}/${progress.total})`)
      }
    })
    console.log(`\n   ✓ Generated ${embeddingsData.chunks.length} embeddings`)
    console.log(`   • Dimensions: ${embeddingsData.stats.totalDimensions}`)
    console.log(`   • Model: ${embeddingsData.stats.model}`)
    console.log(`   • Time: ${embeddingsData.stats.processingTime.toFixed(2)}s`)

    // Step 4: Cleanup old data (if requested)
    if (shouldCleanup) {
      const answer = await question(`\n⚠️  This will DELETE all existing vectors in namespace "${namespace || '(default)'}". Continue? (yes/no): `)
      if (answer.trim().toLowerCase() === 'yes') {
        await cleanupNamespace(indexName, namespace, provider)
      } else {
        console.log(`   ⏭️  Skipping cleanup`)
      }
    }

    // Step 5: Upload to vector database
    console.log(`\n📤 Step 5: Uploading to vector database...`)
    const uploadResult = await uploadVectors(embeddingsData, {
      provider: provider,
      indexName: indexName,
      namespace: namespace,
      transcriptFile: 'knowledge.json',
      batchSize: 100
    })

    if (uploadResult.success) {
      console.log(`\n${'='.repeat(80)}`)
      console.log(`✅ UPDATE COMPLETE!`)
      console.log(`${'='.repeat(80)}`)
      console.log(`\n📊 Final Statistics:`)
      console.log(`   Knowledge objects: ${knowledgeData.knowledge.length}`)
      console.log(`   Chunks created: ${chunksData.chunks.length}`)
      console.log(`   Embeddings generated: ${embeddingsData.chunks.length}`)
      console.log(`   Vectors uploaded: ${uploadResult.stats.totalVectors}`)
      console.log(`   Upload time: ${uploadResult.stats.uploadTime.toFixed(2)}s`)
      console.log(`   Index: ${uploadResult.stats.indexName}`)
      console.log(`   Namespace: ${uploadResult.stats.namespace || '(default)'}`)

      // Get final stats (with retry and delay for Pinecone to update)
      console.log(`\n📊 Verifying database stats (Pinecone may need a moment to update)...`)
      
      let finalStats = null
      let retries = 3
      let verified = false
      
      for (let i = 0; i < retries; i++) {
        if (i > 0) {
          console.log(`   Retry ${i}/${retries - 1}...`)
          await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        }
        
        finalStats = await getIndexStats({
          provider: provider,
          indexName: indexName,
          namespace: namespace
        })
        
        // Check if we got the expected vectors
        let actualCount = 0
        if (provider === 'pinecone' && finalStats.namespaces) {
          Object.entries(finalStats.namespaces).forEach(([ns, data]) => {
            const count = data.vectorCount || 0
            actualCount += count
          })
        } else {
          actualCount = finalStats.totalVectorCount || 0
        }
        
        if (actualCount >= uploadResult.stats.totalVectors) {
          verified = true
          break
        }
      }
      
      console.log(`\n📊 Current database stats:`)
      if (provider === 'pinecone' && finalStats.namespaces) {
        Object.entries(finalStats.namespaces).forEach(([ns, data]) => {
          const count = data.vectorCount || 0
          const status = count > 0 ? '✅' : '⚠️'
          console.log(`   ${status} ${ns || '(default)'}: ${count} vectors`)
        })
      } else {
        const total = finalStats.totalVectorCount || 0
        const status = total > 0 ? '✅' : '⚠️'
        console.log(`   ${status} Total: ${total} vectors`)
      }
      
      if (!verified) {
        console.log(`\n⚠️  Warning: Stats may not be fully updated yet.`)
        console.log(`   Expected: ${uploadResult.stats.totalVectors} vectors`)
        console.log(`   Pinecone stats can take a few seconds to update.`)
        console.log(`   Run 'npm run check-db' in a moment to verify.`)
      } else {
        console.log(`\n✅ Verified: All ${uploadResult.stats.totalVectors} vectors are in the database!`)
      }

      console.log(`\n✅ Knowledge base updated successfully!`)
      console.log(`\n📌 Next steps:`)
      console.log(`   1. Test the API: npm run test:api`)
      console.log(`   2. Start backend: npm start`)
      console.log(`   3. Test chatbot in frontend`)
    } else {
      console.error(`\n❌ Upload failed`)
      process.exit(1)
    }

  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`)
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }

  console.log(`\n${'='.repeat(80)}\n`)
}

main()

