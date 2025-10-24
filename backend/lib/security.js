/**
 * Security Middleware for API Endpoints
 *
 * Implements:
 * - API Key authentication
 * - CORS validation
 * - Rate limiting
 * - Origin checking
 */

// Simple in-memory rate limiter (use Redis in production for multi-instance)
const rateLimitStore = new Map()

/**
 * Rate Limiter
 * Limits requests per IP address
 */
function rateLimit(ip, options = {}) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 20   // 20 requests per minute
  } = options

  const now = Date.now()
  const key = `rate:${ip}`

  // Get or create rate limit record
  let record = rateLimitStore.get(key)

  if (!record || now - record.windowStart > windowMs) {
    // New window
    record = {
      windowStart: now,
      count: 1
    }
    rateLimitStore.set(key, record)
    return { allowed: true, remaining: maxRequests - 1 }
  }

  // Within window
  record.count++

  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((record.windowStart + windowMs - now) / 1000)
    }
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count
  }
}

/**
 * Clean up old rate limit records (run periodically)
 */
function cleanupRateLimitStore() {
  const now = Date.now()
  const maxAge = 300000 // 5 minutes

  for (const [key, record] of rateLimitStore.entries()) {
    if (now - record.windowStart > maxAge) {
      rateLimitStore.delete(key)
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimitStore, 300000)

/**
 * Validate API Key
 */
function validateApiKey(req) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '')

  // Get allowed API keys from environment
  const allowedKeys = (process.env.API_KEYS || '').split(',').filter(k => k.trim())

  // If no API keys configured, allow all (for development)
  if (allowedKeys.length === 0 && process.env.NODE_ENV !== 'production') {
    console.warn('[Security] No API keys configured - allowing all requests (DEV MODE)')
    return { valid: true, warning: 'No API key validation in dev mode' }
  }

  // In production, require API key
  if (!apiKey) {
    return { valid: false, error: 'API key required' }
  }

  if (!allowedKeys.includes(apiKey)) {
    return { valid: false, error: 'Invalid API key' }
  }

  return { valid: true }
}

/**
 * Validate CORS Origin
 */
function validateOrigin(req) {
  const origin = req.headers.origin || req.headers.referer

  // Get allowed origins from environment
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(o => o)

  // In development, allow all origins
  if (process.env.NODE_ENV !== 'production') {
    return { valid: true, origin: origin || '*' }
  }

  // If no origin header, reject (direct API calls)
  if (!origin) {
    return { valid: false, error: 'Origin header required' }
  }

  // Check if origin is allowed
  const isAllowed = allowedOrigins.some(allowed => {
    // Exact match or wildcard subdomain match
    if (allowed === '*') return true
    if (allowed === origin) return true
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2)
      return origin.endsWith(domain)
    }
    return false
  })

  if (!isAllowed) {
    return { valid: false, error: 'Origin not allowed' }
  }

  return { valid: true, origin }
}

/**
 * Get client IP address
 */
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

/**
 * Security Middleware
 * Use this in your API endpoints
 */
function securityMiddleware(req, options = {}) {
  const {
    requireApiKey = true,
    requireOrigin = false,
    enableRateLimit = true,
    rateLimitOptions = {}
  } = options

  const ip = getClientIp(req)
  const results = {
    ip,
    passed: true,
    checks: {}
  }

  // 1. Rate Limiting
  if (enableRateLimit) {
    const rateLimitResult = rateLimit(ip, rateLimitOptions)
    results.checks.rateLimit = rateLimitResult

    if (!rateLimitResult.allowed) {
      results.passed = false
      results.error = 'Rate limit exceeded'
      results.retryAfter = rateLimitResult.retryAfter
      return results
    }
  }

  // 2. API Key Validation
  if (requireApiKey) {
    const apiKeyResult = validateApiKey(req)
    results.checks.apiKey = apiKeyResult

    if (!apiKeyResult.valid) {
      results.passed = false
      results.error = apiKeyResult.error
      return results
    }
  }

  // 3. Origin Validation
  if (requireOrigin) {
    const originResult = validateOrigin(req)
    results.checks.origin = originResult

    if (!originResult.valid) {
      results.passed = false
      results.error = originResult.error
      return results
    }
  }

  return results
}

/**
 * Apply CORS Headers
 */
function applyCorsHeaders(res, origin = '*') {
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours
  return res
}

/**
 * Handle OPTIONS preflight request
 */
function handlePreflight(req, res) {
  if (req.method === 'OPTIONS') {
    applyCorsHeaders(res)
    res.status(200).end()
    return true
  }
  return false
}

module.exports = {
  securityMiddleware,
  applyCorsHeaders,
  handlePreflight,
  validateApiKey,
  validateOrigin,
  rateLimit,
  getClientIp
}
