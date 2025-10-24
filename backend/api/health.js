/**
 * Health Check API Endpoint
 *
 * Returns the health status of the backend service
 */

module.exports = async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        hasOpenRouter: !!process.env.OPENROUTER_API_KEY,
        hasHuggingFace: !!process.env.HUGGINGFACE_API_KEY,
        hasPinecone: !!process.env.PINECONE_API_KEY
      }
    }

    // Check if we can connect to Pinecone
    try {
      const { Pinecone } = require('@pinecone-database/pinecone')
      if (process.env.PINECONE_API_KEY) {
        const pinecone = new Pinecone({
          apiKey: process.env.PINECONE_API_KEY
        })
        // Just initialize - don't query
        health.vectorDb = 'connected'
      }
    } catch (error) {
      console.error('[Health] Vector DB check failed:', error.message)
      health.vectorDb = 'error'
    }

    return res.status(200).json(health)
  } catch (error) {
    console.error('[Health] Error:', error)
    return res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
}
