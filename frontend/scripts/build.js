#!/usr/bin/env node

import { execSync } from 'child_process';
import os from 'os';

const platform = os.platform();
const arch = os.arch();

console.log(`Building for platform: ${platform} (${arch})`);

// Clean dist directory
try {
  if (platform === 'win32') {
    execSync('cmd /c "if exist dist rmdir /s /q dist"', { stdio: 'inherit' });
  } else {
    execSync('rm -rf dist', { stdio: 'inherit' });
  }
  console.log('✓ Cleaned dist directory');
} catch (error) {
  console.log('ℹ Dist directory already clean or does not exist');
}

// Run Vite build
try {
  execSync('npx vite build', { stdio: 'inherit' });
  console.log('✓ Build completed successfully');
} catch (error) {
  console.error('✗ Build failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 Cross-platform build completed successfully!');
console.log(`Platform: ${platform} ${arch}`);
console.log('Build artifacts are in the dist/ directory');
