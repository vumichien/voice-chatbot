/**
 * Text-to-Speech Service
 * 
 * ElevenLabs API integration for generating speech audio from text
 * Returns base64-encoded audio for easy transmission
 */

const crypto = require('crypto');

// Configuration from environment variables
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '8d0prjevDzRbEWBUu6H1';
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5';

/**
 * Generate speech audio from text using ElevenLabs API
 * @param {string} text - Text to convert to speech
 * @returns {Promise<string>} Base64-encoded audio data
 */
async function generateSpeech(text) {
  // Validate API key
  if (!ELEVENLABS_API_KEY) {
    console.error('[TTS] ELEVENLABS_API_KEY not configured');
    throw new Error('ElevenLabs API key not configured');
  }

  // Validate input
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Invalid text input for TTS');
  }

  console.log(`[TTS] Generating speech for text (${text.length} chars): "${text.substring(0, 50)}..."`);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
  
  const requestBody = {
    text: text,
    model_id: MODEL_ID,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TTS] ElevenLabs API error: ${response.status} - ${errorText}`);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    // Get audio data as buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    
    console.log(`[TTS] Audio generated successfully (${(audioBuffer.byteLength / 1024).toFixed(2)} KB)`);
    
    return base64Audio;

  } catch (error) {
    console.error('[TTS] Error generating speech:', error.message);
    throw error;
  }
}

/**
 * Generate hash for text (used for caching)
 * @param {string} text - Text to hash
 * @returns {string} SHA256 hash
 */
function generateTextHash(text) {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

/**
 * Check if TTS service is configured and available
 * @returns {boolean} True if service is ready
 */
function isConfigured() {
  return !!ELEVENLABS_API_KEY;
}

module.exports = {
  generateSpeech,
  generateTextHash,
  isConfigured
};

