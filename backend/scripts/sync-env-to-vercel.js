#!/usr/bin/env node
/**
 * Sync .env file to Vercel environment variables
 * Usage: node scripts/sync-env-to-vercel.js [environment]
 * Default environment: production
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ENV_FILE = path.join(__dirname, '..', '.env');
const ENVIRONMENT = process.argv[2] || 'production';

console.log('==========================================');
console.log('Syncing .env to Vercel');
console.log('==========================================');
console.log('');

// Check if .env file exists
if (!fs.existsSync(ENV_FILE)) {
  console.error(`Error: .env file not found at ${ENV_FILE}`);
  process.exit(1);
}

// Read and parse .env file
console.log('Reading .env file...');
const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
const envVars = {};

envContent.split('\n').forEach((line) => {
  const trimmedLine = line.trim();
  
  // Skip comments and empty lines
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const equalIndex = trimmedLine.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmedLine.substring(0, equalIndex).trim();
      let value = trimmedLine.substring(equalIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      if (key) {
        envVars[key] = value;
      }
    }
  }
});

console.log(`Found ${Object.keys(envVars).length} environment variables`);
console.log('');

let successCount = 0;
let failCount = 0;

// Set each environment variable
async function setEnvVar(key, value) {
  return new Promise((resolve) => {
    process.stdout.write(`Setting ${key}...`);
    
    // Use vercel env add command with value piped to stdin
    const vercel = spawn('vercel', ['env', 'add', key, ENVIRONMENT, '--force'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let stdout = '';
    let stderr = '';
    
    vercel.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    vercel.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    vercel.on('close', (code) => {
      if (code === 0) {
        console.log(' [OK]');
        successCount++;
        resolve(true);
      } else {
        // Check if it's because the variable already exists
        if (stderr.includes('already exists') || stdout.includes('already exists')) {
          console.log(' [SKIP] Already exists');
          resolve(true);
        } else {
          console.log(' [WARN] Failed');
          failCount++;
          resolve(false);
        }
      }
    });
    
    // Send value to stdin
    vercel.stdin.write(value);
    vercel.stdin.end();
  });
}

// Process all environment variables sequentially
(async () => {
  for (const [key, value] of Object.entries(envVars)) {
    await setEnvVar(key, value);
  }
  
  console.log('');
  console.log('==========================================');
  console.log('Sync Complete!');
  console.log(`Success: ${successCount}`);
  console.log(`Warnings: ${failCount}`);
  console.log('==========================================');
})();

