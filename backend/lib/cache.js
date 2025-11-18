/**
 * In-Memory Cache for Audio Responses
 * 
 * Simple caching system to store TTS audio responses
 * Reduces API calls and improves response time
 */

const crypto = require('crypto');

// Cache storage: Map<textHash, {audio: base64String, timestamp: Date}>
const audioCache = new Map();

// Configuration
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 1000; // Maximum number of cached entries

/**
 * Generate cache key from text
 * @param {string} text - Text to hash
 * @returns {string} SHA256 hash
 */
function generateCacheKey(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

/**
 * Get cached audio for text
 * @param {string} text - Text to lookup
 * @returns {string|null} Base64 audio or null if not found/expired
 */
function getCachedAudio(text) {
  const key = generateCacheKey(text);
  const cached = audioCache.get(key);

  if (!cached) {
    console.log('[Cache] Miss - not found');
    return null;
  }

  // Check if expired
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    console.log('[Cache] Miss - expired');
    audioCache.delete(key);
    return null;
  }

  console.log(`[Cache] Hit - age: ${Math.round(age / 1000 / 60)} minutes`);
  return cached.audio;
}

/**
 * Store audio in cache
 * @param {string} text - Text key
 * @param {string} audioBase64 - Base64 encoded audio
 */
function setCachedAudio(text, audioBase64) {
  // Check cache size limit
  if (audioCache.size >= MAX_CACHE_SIZE) {
    console.log('[Cache] Size limit reached, clearing oldest entries');
    clearOldestEntries(Math.floor(MAX_CACHE_SIZE * 0.2)); // Clear 20%
  }

  const key = generateCacheKey(text);
  audioCache.set(key, {
    audio: audioBase64,
    timestamp: Date.now()
  });

  console.log(`[Cache] Stored entry (total: ${audioCache.size})`);
}

/**
 * Clear oldest cache entries
 * @param {number} count - Number of entries to remove
 */
function clearOldestEntries(count) {
  // Convert to array, sort by timestamp, and remove oldest
  const entries = Array.from(audioCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp)
    .slice(0, count);

  entries.forEach(([key]) => audioCache.delete(key));
  console.log(`[Cache] Cleared ${count} oldest entries`);
}

/**
 * Clear expired entries from cache
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  let removed = 0;

  for (const [key, value] of audioCache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      audioCache.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`[Cache] Cleanup removed ${removed} expired entries`);
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
function getCacheStats() {
  return {
    size: audioCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttlHours: CACHE_TTL_MS / (60 * 60 * 1000)
  };
}

/**
 * Clear all cache entries
 */
function clearCache() {
  audioCache.clear();
  console.log('[Cache] All entries cleared');
}

// Periodic cleanup (every hour)
setInterval(cleanupExpiredEntries, 60 * 60 * 1000);

module.exports = {
  getCachedAudio,
  setCachedAudio,
  getCacheStats,
  clearCache,
  cleanupExpiredEntries
};

