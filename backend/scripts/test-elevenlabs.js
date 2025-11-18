/**
 * ElevenLabs Text-to-Speech Test Script
 * 
 * This script tests the ElevenLabs API integration
 * Model: eleven_multilingual_v3
 * Output Format: mp3_44100_128
 * Voice ID: 8d0prjevDzRbEWBUu6H1
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = '8d0prjevDzRbEWBUu6H1';
const MODEL_ID = 'eleven_v3';
const OUTPUT_FORMAT = 'mp3_44100_128';

// Test text samples (English and Vietnamese)
const TEST_TEXTS = [
  {
    name: 'japanese',
    text: 'こんにちは！これはElevenLabsのテキスト読み上げのテストです。'
  }
];

/**
 * Generate speech using ElevenLabs API
 */
async function generateSpeech(text, outputFilename) {
  console.log(`\n🎤 Generating speech for: "${text.substring(0, 50)}..."`);
  
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY not found in environment variables');
  }

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
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Get audio data as buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Save to file
    const outputDir = path.join(__dirname, '../output/audio');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, outputFilename);
    fs.writeFileSync(outputPath, Buffer.from(audioBuffer));
    
    console.log(`✅ Audio saved to: ${outputPath}`);
    console.log(`   File size: ${(audioBuffer.byteLength / 1024).toFixed(2)} KB`);
    
    return outputPath;
  } catch (error) {
    console.error(`❌ Error generating speech:`, error.message);
    throw error;
  }
}

/**
 * Get voice information
 */
async function getVoiceInfo() {
  console.log('\n📋 Fetching voice information...');
  
  const url = `https://api.elevenlabs.io/v1/voices/${VOICE_ID}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voice info: ${response.status}`);
    }

    const voiceData = await response.json();
    console.log('✅ Voice Information:');
    console.log(`   Name: ${voiceData.name}`);
    console.log(`   Category: ${voiceData.category}`);
    console.log(`   Labels: ${JSON.stringify(voiceData.labels)}`);
    
    return voiceData;
  } catch (error) {
    console.error(`❌ Error fetching voice info:`, error.message);
    return null;
  }
}

/**
 * Check API quota
 */
async function checkQuota() {
  console.log('\n📊 Checking API quota...');
  
  const url = 'https://api.elevenlabs.io/v1/user';
  
  try {
    const response = await fetch(url, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch quota: ${response.status}`);
    }

    const userData = await response.json();
    const subscription = userData.subscription;
    
    console.log('✅ Subscription Status:');
    console.log(`   Tier: ${subscription.tier}`);
    console.log(`   Character Count: ${subscription.character_count} / ${subscription.character_limit}`);
    console.log(`   Characters Remaining: ${subscription.character_limit - subscription.character_count}`);
    
    return userData;
  } catch (error) {
    console.error(`❌ Error checking quota:`, error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 ElevenLabs TTS Test Script');
  console.log('='.repeat(60));
  console.log(`Model: ${MODEL_ID}`);
  console.log(`Output Format: ${OUTPUT_FORMAT}`);
  console.log(`Voice ID: ${VOICE_ID}`);
  console.log('='.repeat(60));

  try {
    // Check API key
    if (!ELEVENLABS_API_KEY) {
      console.error('\n❌ ERROR: ELEVENLABS_API_KEY not found in .env file');
      console.log('\nPlease add the following to your backend/.env file:');
      console.log('ELEVENLABS_API_KEY=your_api_key_here');
      process.exit(1);
    }

    // Get voice info
    await getVoiceInfo();

    // Check quota
    await checkQuota();

    // Generate speech for each test text
    console.log('\n' + '='.repeat(60));
    console.log('🎵 Generating speech samples...');
    console.log('='.repeat(60));

    for (const test of TEST_TEXTS) {
      const filename = `test_${test.name}_${Date.now()}.mp3`;
      await generateSpeech(test.text, filename);
      
      // Wait a bit between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(60));
    console.log('\n💡 Check the backend/output/audio/ folder for generated MP3 files');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main();
