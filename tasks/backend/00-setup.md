# Task 00: Backend Setup

**Status**: [x] DONE
**Estimated Time**: 2 hours
**Dependencies**: None
**Priority**: HIGH (Must complete first)
**Started**: 2025-01-19
**Completed**: 2025-01-19

---

## 📋 Description

Initialize the Node.js backend project with all required dependencies and folder structure for the voice chatbot knowledge base system.

---

## 🎯 Goals

1. Initialize Node.js project with TypeScript/JavaScript
2. Install all required dependencies
3. Create folder structure for organized development
4. Setup Vercel configuration
5. Create environment variable template
6. Setup basic utilities and helpers

---

## ✅ Acceptance Criteria

- [ ] `package.json` created with correct dependencies
- [ ] Folder structure matches PRD specification
- [ ] `vercel.json` configured for serverless functions
- [ ] `.env.example` contains all required variables
- [ ] Can run `npm install` without errors
- [ ] TypeScript/ESLint configured (if using TS)
- [ ] Git repository initialized with `.gitignore`

---

## 📦 Required Dependencies

### Core Dependencies
```json
{
  "dependencies": {
    "@langchain/core": "^0.1.0",
    "@langchain/openai": "^0.0.20",
    "@pinecone-database/pinecone": "^2.0.0",
    "openai": "^4.0.0",
    "axios": "^1.6.0",
    "dotenv": "^16.0.0",
    "kuromoji": "^0.1.2",
    "budoux": "^0.6.0",
    "subsrt-ts": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "@vercel/node": "^3.0.0"
  }
}
```

### Alternative Vector DB (if using Upstash)
```bash
npm install @upstash/vector
```

---

## 📁 Folder Structure to Create

```
voice-chatbot/
├── api/                     # Vercel serverless functions
│   ├── chat.js
│   ├── health.js
│   └── initialize.js
├── lib/                     # Core library code
│   ├── parser.js
│   ├── text-reconstructor.js
│   ├── content-cleaner.js
│   ├── knowledge-extractor.js
│   ├── semantic-chunker.js
│   ├── embeddings.js
│   ├── vectordb.js
│   ├── content-pipeline.js
│   └── rag.js
├── tests/                   # Test files
│   ├── unit/
│   └── integration/
├── data/                    # Data files
│   ├── transcript.srt
│   └── processed/
├── scripts/                 # Utility scripts
│   ├── setup-db.js
│   ├── process-transcript.js
│   └── test-retrieval.js
├── utils/                   # Helper functions
│   └── logger.js
├── package.json
├── vercel.json
├── .env.example
├── .gitignore
└── README.md
```

---

## 🧪 Testing Checklist

### Installation Tests
- [ ] Run `npm install` - completes without errors
- [ ] Run `npm list` - all dependencies installed correctly
- [ ] No security vulnerabilities (`npm audit`)

### Configuration Tests
- [ ] `vercel.json` is valid JSON
- [ ] `.env.example` has all required keys
- [ ] Can import core libraries:
  ```javascript
  const { OpenAI } = require('openai')
  const { Pinecone } = require('@pinecone-database/pinecone')
  console.log('Dependencies loaded successfully')
  ```

### Folder Structure Tests
- [ ] All folders exist: `ls -la api/ lib/ tests/ data/ scripts/ utils/`
- [ ] `.gitignore` excludes:
  - `node_modules/`
  - `.env`
  - `*.log`
  - `data/processed/`

### TypeScript Tests (if using TS)
- [ ] `tsconfig.json` compiles without errors
- [ ] Run `npm run build` successfully

---

## 📝 Implementation Steps

### Step 1: Initialize Project
```bash
cd C:\Project\Detomo\2025\voice-chatbot
npm init -y
```

### Step 2: Install Dependencies
```bash
npm install @langchain/core @langchain/openai @pinecone-database/pinecone openai axios dotenv kuromoji budoux subsrt-ts

npm install --save-dev @types/node jest @vercel/node
```

### Step 3: Create Folder Structure
```bash
mkdir -p api lib tests/unit tests/integration data/processed scripts utils
```

### Step 4: Create vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Step 5: Create .env.example
```env
# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_key_here

# Vector Database (Pinecone)
PINECONE_API_KEY=your_pinecone_key_here
PINECONE_INDEX_NAME=transcript-knowledge
PINECONE_ENVIRONMENT=us-east-1

# OpenAI for Embeddings
OPENAI_API_KEY=your_openai_key_here

# Admin
ADMIN_KEY=your_secret_admin_key_here

# Optional: Upstash Vector (alternative to Pinecone)
# UPSTASH_VECTOR_URL=your_upstash_url
# UPSTASH_VECTOR_TOKEN=your_upstash_token
```

### Step 6: Create .gitignore
```
node_modules/
.env
.env.local
*.log
.DS_Store
.vercel
data/processed/
dist/
build/
coverage/
```

### Step 7: Update package.json Scripts
```json
{
  "scripts": {
    "dev": "vercel dev",
    "test": "jest",
    "test:watch": "jest --watch",
    "process-transcript": "node scripts/process-transcript.js",
    "setup-db": "node scripts/setup-db.js"
  }
}
```

---

## 🔍 Validation Commands

Run these to verify setup is complete:

```bash
# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# Verify all dependencies installed
npm list --depth=0

# Check for vulnerabilities
npm audit

# Verify folder structure
ls -la

# Test environment variables
node -e "require('dotenv').config(); console.log('ENV loaded:', !!process.env.OPENAI_API_KEY)"
```

---

## 📚 Additional Files to Create

### utils/logger.js
```javascript
const logger = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
  debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args)
}

module.exports = logger
```

### README.md
Create basic project README with:
- Project description
- Setup instructions
- Environment variables guide
- How to run locally

---

## ⚠️ Common Issues & Solutions

### Issue: `npm install` fails
- **Solution**: Clear npm cache: `npm cache clean --force`
- **Solution**: Delete `node_modules` and `package-lock.json`, retry

### Issue: Kuromoji installation error
- **Solution**: May need build tools on Windows
- **Alternative**: Use cloud-based Japanese NLP API

### Issue: Vercel CLI not working
- **Solution**: Install globally: `npm install -g vercel`

---

## ✨ Success Criteria

Task is complete when:
1. ✅ All dependencies installed without errors
2. ✅ Folder structure created and matches specification
3. ✅ `vercel.json` and `.env.example` configured
4. ✅ Can run `npm install` and `npm test` (even with 0 tests)
5. ✅ Git repository initialized with proper `.gitignore`
6. ✅ No security vulnerabilities in dependencies

---

## 📌 Next Task

After completing this task, proceed to:
**Task 01: Stage 1 - SRT Parser** (`tasks/backend/01-stage1-parser.md`)

---

**Status**: [ ] TODO
**Started**: _____
**Completed**: _____
**Notes**: _____
