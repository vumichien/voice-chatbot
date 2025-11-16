/**
 * Health Check API Endpoint
 *
 * Returns the health status of the backend service
 */

const { securityMiddleware, applyCorsHeaders } = require('../lib/security')

module.exports = async (req, res) => {
  // Determine allowed origin
  const allowedOrigins = [
    'https://frontend-vumichies-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ]
  const origin = req.headers.origin
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : '*'

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    applyCorsHeaders(res, allowedOrigin)
    return res.status(200).end()
  }

  // Apply CORS headers
  applyCorsHeaders(res, allowedOrigin)

  // Light security check (rate limit only, no API key required for health checks)
  const security = securityMiddleware(req, {
    requireApiKey: false,
    enableRateLimit: true,
    rateLimitOptions: {
      windowMs: 60000,  // 1 minute
      maxRequests: 30    // 30 requests per minute (more lenient for health checks)
    }
  })

  if (!security.passed) {
    return res.status(429).json({
      error: security.error,
      retryAfter: security.retryAfter
    })
  }
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
