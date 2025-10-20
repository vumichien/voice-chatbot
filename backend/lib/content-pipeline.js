/**
 * Content Processing Pipeline Orchestrator
 *
 * Orchestrates all 7 stages of content processing:
 * 1. SRT Parser
 * 2. Text Reconstructor
 * 3. Content Cleaner
 * 4. Knowledge Extractor
 * 5. Semantic Chunker
 * 6. Embeddings Generator
 * 7. Vector DB Uploader
 */

const fs = require('fs').promises
const path = require('path')
const { parseSRT } = require('./parser')
const { reconstructText } = require('./text-reconstructor')
const { cleanContent } = require('./content-cleaner')
const { extractKnowledge } = require('./knowledge-extractor')
const { createSemanticChunks } = require('./semantic-chunker')
const { generateEmbeddings } = require('./embeddings')
const { uploadVectors } = require('./vectordb')

/**
 * Default pipeline configuration
 */
const DEFAULT_CONFIG = {
  // Language
  language: 'ja',

  // Stage 3: Cleaning
  enableCleaning: true,
  enableErrorCorrection: true,
  normalizeChars: true,
  removeNonVerbal: true,
  removeFillers: false,

  // Stage 4: Knowledge extraction
  extractKeywords: true,
  generateQA: false,

  // Stage 5: Chunking
  minChunkSize: 200,
  maxChunkSize: 1000,
  includeContext: true,

  // Stage 6: Embeddings
  embeddingProvider: 'huggingface',
  embeddingModel: 'multilingual-e5-base',
  embeddingBatchSize: 100,

  // Stage 7: Vector DB
  vectorDBProvider: 'pinecone',
  vectorDBIndexName: 'transcript-knowledge',
  vectorDBNamespace: '',
  vectorDBBatchSize: 100,

  // Output
  saveIntermediateResults: false,
  outputDir: './output'
}

/**
 * Pipeline progress tracker
 */
class PipelineProgress {
  constructor(onProgress) {
    this.onProgress = onProgress
    this.stages = [
      'Parse SRT',
      'Reconstruct Text',
      'Clean Content',
      'Extract Knowledge',
      'Create Chunks',
      'Generate Embeddings',
      'Upload to Vector DB'
    ]
    this.currentStage = 0
    this.startTime = Date.now()
  }

  start(stageIndex, message) {
    this.currentStage = stageIndex
    const stageName = this.stages[stageIndex]

    if (this.onProgress) {
      this.onProgress({
        stage: stageIndex + 1,
        totalStages: this.stages.length,
        stageName,
        message,
        percentage: Math.round(((stageIndex) / this.stages.length) * 100),
        elapsedTime: (Date.now() - this.startTime) / 1000
      })
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log(`Stage ${stageIndex + 1}/${this.stages.length}: ${stageName}`)
    console.log(`${'='.repeat(80)}`)
  }

  complete(stageIndex, result) {
    if (this.onProgress) {
      this.onProgress({
        stage: stageIndex + 1,
        totalStages: this.stages.length,
        stageName: this.stages[stageIndex],
        message: 'Complete',
        percentage: Math.round(((stageIndex + 1) / this.stages.length) * 100),
        elapsedTime: (Date.now() - this.startTime) / 1000,
        result
      })
    }
  }
}

/**
 * Save intermediate results to file
 */
async function saveIntermediateResult(data, filename, outputDir) {
  try {
    await fs.mkdir(outputDir, { recursive: true })
    const filepath = path.join(outputDir, filename)
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`   💾 Saved: ${filepath}`)
  } catch (error) {
    console.warn(`   ⚠️  Failed to save ${filename}: ${error.message}`)
  }
}

/**
 * Main pipeline processor
 */
async function processTranscript(srtFilePath, config = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const progress = new PipelineProgress(cfg.onProgress)
  const results = {}

  try {
    // Stage 1: Parse SRT
    progress.start(0, 'Parsing SRT file...')
    const segments = await parseSRT(srtFilePath)
    results.segments = segments
    console.log(`✓ Parsed ${segments.length} segments`)
    progress.complete(0, { count: segments.length })

    if (cfg.saveIntermediateResults) {
      await saveIntermediateResult(segments, '01-segments.json', cfg.outputDir)
    }

    // Stage 2: Reconstruct Text
    progress.start(1, 'Reconstructing sentences...')
    const reconstructed = await reconstructText(segments)
    results.reconstructed = reconstructed
    console.log(`✓ Created ${reconstructed.paragraphs.length} paragraphs from ${reconstructed.sentences.length} sentences`)
    progress.complete(1, {
      paragraphs: reconstructed.paragraphs.length,
      sentences: reconstructed.sentences.length
    })

    if (cfg.saveIntermediateResults) {
      await saveIntermediateResult(reconstructed, '02-reconstructed.json', cfg.outputDir)
    }

    // Stage 3: Clean Content
    progress.start(2, 'Cleaning and normalizing...')
    const cleaned = await cleanContent(reconstructed, {
      removeFillers: cfg.removeFillers,
      fixErrors: cfg.enableErrorCorrection,
      normalizeChars: cfg.normalizeChars,
      removeNonVerbal: cfg.removeNonVerbal
    })
    results.cleaned = cleaned
    console.log(`✓ Cleaned ${cleaned.cleanedParagraphs.length} paragraphs`)
    console.log(`✓ Applied ${cleaned.stats.totalCorrections} corrections`)
    progress.complete(2, {
      paragraphs: cleaned.cleanedParagraphs.length,
      corrections: cleaned.stats.totalCorrections
    })

    if (cfg.saveIntermediateResults) {
      await saveIntermediateResult(cleaned, '03-cleaned.json', cfg.outputDir)
    }

    // Stage 4: Extract Knowledge
    progress.start(3, 'Extracting knowledge...')
    const knowledge = await extractKnowledge(cleaned, {
      useAI: false,
      generateQA: cfg.generateQA
    })
    results.knowledge = knowledge
    console.log(`✓ Extracted ${knowledge.knowledge.length} knowledge objects`)
    console.log(`   • High importance: ${knowledge.stats.highImportance}`)
    console.log(`   • Medium importance: ${knowledge.stats.mediumImportance}`)
    console.log(`   • Low importance: ${knowledge.stats.lowImportance}`)
    progress.complete(3, {
      total: knowledge.knowledge.length,
      highImportance: knowledge.stats.highImportance
    })

    if (cfg.saveIntermediateResults) {
      await saveIntermediateResult(knowledge, '04-knowledge.json', cfg.outputDir)
    }

    // Stage 5: Create Semantic Chunks
    progress.start(4, 'Creating semantic chunks...')
    const chunks = createSemanticChunks(knowledge, {
      minChunkSize: cfg.minChunkSize,
      maxChunkSize: cfg.maxChunkSize,
      includeContext: cfg.includeContext
    })
    results.chunks = chunks
    console.log(`✓ Created ${chunks.chunks.length} semantic chunks`)
    console.log(`   • Average size: ${chunks.stats.avgChunkSize} chars`)
    progress.complete(4, {
      total: chunks.chunks.length,
      avgSize: chunks.stats.avgChunkSize
    })

    if (cfg.saveIntermediateResults) {
      await saveIntermediateResult(chunks, '05-chunks.json', cfg.outputDir)
    }

    // Stage 6: Generate Embeddings
    progress.start(5, 'Generating embeddings...')
    const embeddings = await generateEmbeddings(chunks, {
      provider: cfg.embeddingProvider,
      model: cfg.embeddingModel,
      batchSize: cfg.embeddingBatchSize,
      onProgress: (embProgress) => {
        console.log(`   Progress: ${embProgress.percentage}%`)
      }
    })
    results.embeddings = embeddings
    console.log(`✓ Generated ${embeddings.chunks.length} embeddings`)
    console.log(`   • Dimensions: ${embeddings.stats.totalDimensions}`)
    console.log(`   • Model: ${embeddings.stats.model}`)
    console.log(`   • Time: ${embeddings.stats.processingTime.toFixed(2)}s`)
    progress.complete(5, {
      total: embeddings.chunks.length,
      dimensions: embeddings.stats.totalDimensions,
      model: embeddings.stats.model
    })

    if (cfg.saveIntermediateResults) {
      await saveIntermediateResult(embeddings, '06-embeddings.json', cfg.outputDir)
    }

    // Stage 7: Upload to Vector DB
    progress.start(6, 'Uploading to vector database...')
    const transcriptName = path.basename(srtFilePath, '.srt')
    const upload = await uploadVectors(embeddings, {
      provider: cfg.vectorDBProvider,
      indexName: cfg.vectorDBIndexName,
      namespace: cfg.vectorDBNamespace,
      transcriptFile: transcriptName,
      batchSize: cfg.vectorDBBatchSize
    })
    results.upload = upload
    console.log(`✓ Uploaded ${upload.stats.totalVectors} vectors`)
    console.log(`   • Provider: ${upload.stats.provider}`)
    console.log(`   • Index: ${upload.stats.indexName}`)
    progress.complete(6, {
      total: upload.stats.totalVectors,
      provider: upload.stats.provider
    })

    // Generate final statistics
    const endTime = Date.now()
    const totalTime = (endTime - progress.startTime) / 1000

    const finalStats = {
      success: true,
      totalTime,
      transcript: {
        file: srtFilePath,
        name: transcriptName
      },
      stages: {
        segments: segments.length,
        sentences: reconstructed.sentences.length,
        paragraphs: reconstructed.paragraphs.length,
        corrections: cleaned.stats.totalCorrections,
        knowledgeObjects: knowledge.knowledge.length,
        chunks: chunks.chunks.length,
        embeddings: embeddings.chunks.length,
        vectorsUploaded: upload.stats.totalVectors
      },
      config: {
        embeddingModel: cfg.embeddingModel,
        embeddingProvider: cfg.embeddingProvider,
        vectorDBProvider: cfg.vectorDBProvider,
        dimensions: embeddings.stats.totalDimensions
      }
    }

    console.log(`\n${'='.repeat(80)}`)
    console.log('✅ PIPELINE COMPLETE!')
    console.log(`${'='.repeat(80)}`)
    console.log(`Total time: ${totalTime.toFixed(2)}s`)
    console.log(`Transcript: ${transcriptName}`)
    console.log(`Segments → Knowledge → Chunks → Embeddings → Vector DB`)
    console.log(`${segments.length} → ${knowledge.knowledge.length} → ${chunks.chunks.length} → ${embeddings.chunks.length} → ${upload.stats.totalVectors}`)

    return {
      success: true,
      stats: finalStats,
      results
    }

  } catch (error) {
    console.error(`\n❌ Pipeline failed at stage ${progress.currentStage + 1}:`)
    console.error(error)

    return {
      success: false,
      error: {
        message: error.message,
        stage: progress.currentStage + 1,
        stageName: progress.stages[progress.currentStage]
      },
      results
    }
  }
}

/**
 * Process multiple transcripts
 */
async function processBatch(srtFiles, config = {}) {
  const results = []

  for (let i = 0; i < srtFiles.length; i++) {
    const file = srtFiles[i]
    console.log(`\n📄 Processing ${i + 1}/${srtFiles.length}: ${file}`)

    const result = await processTranscript(file, config)
    results.push({
      file,
      ...result
    })

    // Add delay between files
    if (i < srtFiles.length - 1) {
      console.log('\n⏱️  Waiting 2s before next file...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  return results
}

module.exports = {
  processTranscript,
  processBatch,
  DEFAULT_CONFIG
}
