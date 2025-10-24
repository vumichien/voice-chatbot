#!/usr/bin/env node

import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';
import path from 'path';

const platform = os.platform();
const distPath = path.join(process.cwd(), 'dist');

console.log(`Cleaning dist directory for platform: ${platform}`);

// Check if dist directory exists
if (!fs.existsSync(distPath)) {
  console.log('ℹ Dist directory does not exist, nothing to clean');
  process.exit(0);
}

try {
  // Use platform-specific commands to remove directory
  if (platform === 'win32') {
    // Windows command
    execSync('cmd /c "if exist dist rmdir /s /q dist"', { stdio: 'inherit' });
  } else {
    // Unix-like systems (Linux, macOS)
    execSync('rm -rf dist', { stdio: 'inherit' });
  }
  console.log('✓ Dist directory cleaned successfully');
} catch (error) {
  // If command fails, try using Node.js fs module as fallback
  try {
    console.log('⚠ Command failed, trying Node.js fallback...');
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('✓ Dist directory cleaned successfully (using Node.js fallback)');
  } catch (fsError) {
    console.log('ℹ Dist directory already clean or does not exist');
  }
}
