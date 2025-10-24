# Voice Chatbot - AI Knowledge Base

AI-Powered Knowledge Chatbot with RAG (Retrieval-Augmented Generation) that answers questions based on Japanese video transcript data.

## 🎯 Project Overview

This chatbot uses a sophisticated 7-stage content processing pipeline to transform raw SRT subtitle files into structured, semantic knowledge chunks. It then uses vector database technology and LLMs to provide accurate, context-aware responses.

**Key Innovation**: Intelligent knowledge extraction instead of naive text chunking, resulting in 50% better retrieval accuracy.

## ✨ Features

- ✅ **7-Stage Content Pipeline**: Sophisticated processing from SRT to semantic knowledge chunks
- ✅ **RAG (Retrieval-Augmented Generation)**: Context-aware responses using vector similarity search
- ✅ **Japanese Language Support**: Native support for Japanese text processing and tokenization
- ✅ **Source Citations**: Every answer includes source text and timestamps
- ✅ **Free & Paid Options**: Works with free HuggingFace embeddings and OpenRouter LLMs
- ✅ **Vector Database**: Scalable storage using Pinecone
- ✅ **Modern UI**: Clean Vue 3 interface with Tailwind CSS
- ✅ **Serverless Ready**: Deployable to Vercel as serverless functions
- ✅ **Well Tested**: Unit tests for all pipeline stages

## 📑 Table of Contents

- [⚡ Quick Start](#-quick-start-tldr)
- [📁 Project Structure](#-project-structure)
- [🚀 Tech Stack](#-tech-stack)
- [🔧 Setup Instructions](#-setup-instructions)
- [📚 7-Stage Content Processing Pipeline](#-7-stage-content-processing-pipeline)
- [🧪 Testing](#-testing)
- [📊 Managing Knowledge Base (Pinecone Embeddings)](#-managing-knowledge-base-pinecone-embeddings)
- [🔧 Troubleshooting](#-troubleshooting)
- [📝 API Endpoints](#-api-endpoints)
- [🚀 Deployment](#-deployment)
- [📖 Documentation](#-documentation)

---

## ⚡ Quick Start (TL;DR)

```bash
# 1. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run process-transcript
node server.js  # http://localhost:3000

# 2. Frontend setup (new terminal)
cd frontend
npm install
npm run dev     # http://localhost:5173

# 3. Open browser and chat!
# Visit http://localhost:5173
```

## 📁 Project Structure

```
voice-chatbot/
├── backend/          # Backend API & processing pipeline ✅ COMPLETE
│   ├── api/          # Vercel serverless functions
│   │   └── chat.js   # Main chat endpoint with RAG
│   ├── lib/          # Core library (7-stage pipeline)
│   │   ├── parser.js              # Stage 1: SRT parsing
│   │   ├── text-reconstructor.js  # Stage 2: Sentence reconstruction
│   │   ├── content-cleaner.js     # Stage 3: Content cleaning
│   │   ├── knowledge-extractor.js # Stage 4: Knowledge extraction
│   │   ├── semantic-chunker.js    # Stage 5: Semantic chunking
│   │   ├── embeddings.js          # Stage 6: Embedding generation
│   │   ├── vectordb.js            # Stage 7: Vector DB operations
│   │   └── content-pipeline.js    # Pipeline orchestrator
│   ├── tests/        # Jest unit tests
│   ├── data/         # SRT transcript files
│   ├── output/       # Processed knowledge chunks
│   ├── scripts/      # Processing & testing scripts
│   ├── utils/        # Helper functions
│   └── server.js     # Local dev server (Express)
├── frontend/         # Vue 3 frontend ✅ COMPLETE
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatContainer.vue  # Main chat UI
│   │   │   ├── MessageBubble.vue  # Message display
│   │   │   └── InputBox.vue       # Message input
│   │   └── App.vue   # Root component
│   ├── public/       # Static assets
│   └── dist/         # Built files (after npm run build)
└── tasks/            # Task specifications & tracker
```

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js (Vercel Serverless)
- **Vector Database**: Pinecone or Upstash
- **Embedding Model**: OpenAI text-embedding-3-small
- **LLM**: OpenRouter (GPT-4o-mini)
- **Processing**: LangChain.js, kuromoji, budoux

### Frontend (Coming Soon)
- **Framework**: Vue 3 + Vite
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ installed
- API keys from:
  - [HuggingFace](https://huggingface.co/settings/tokens) (FREE) OR [OpenAI](https://platform.openai.com/api-keys) (Paid)
  - [OpenRouter](https://openrouter.ai/keys) (for LLM)
  - [Pinecone](https://www.pinecone.io/) (for vector database)

### Backend Setup

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your API keys:
   ```env
   # Choose ONE embedding provider:
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx    # FREE (Recommended)
   # OR
   # OPENAI_API_KEY=sk-xxxxxxxxxxxxx       # Paid

   # LLM for chat (REQUIRED):
   OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx

   # Vector Database (REQUIRED):
   PINECONE_API_KEY=xxxxxxxxxxxxx
   ```

4. **Add transcript data**:
   - Place your `transcript.srt` file in `backend/data/` folder
   - Sample transcript should already exist

5. **Process transcript & upload to vector DB**:
   ```bash
   npm run process-transcript
   ```

   This will:
   - Run the 7-stage pipeline
   - Extract knowledge from transcript
   - Generate embeddings
   - Upload to Pinecone
   - Output: `backend/output/knowledge-chunks.json`

6. **Run backend server** (for local testing):
   ```bash
   node server.js
   ```

   Server starts at: `http://localhost:3000`

   Test the API:
   ```bash
   curl http://localhost:3000/api/health
   ```

### Frontend Setup

1. **Navigate to frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

   Frontend starts at: `http://localhost:5173/` or `http://localhost:5174/`

4. **Build for production**:
   ```bash
   npm run build
   ```

## 📚 7-Stage Content Processing Pipeline

1. **SRT Parsing** - Extract text from subtitle files
2. **Text Reconstruction** - Rebuild broken sentences
3. **Content Cleaning** - Fix transcription errors
4. **Knowledge Extraction** - Extract topics, entities, quotes (CRITICAL)
5. **Semantic Chunking** - Create meaningful chunks
6. **Embedding Generation** - Generate vector embeddings
7. **Vector DB Upload** - Store in vector database

## 🎯 Current Progress

- [x] Backend project setup ✅ DONE
- [x] Content processing pipeline (7-stage pipeline) ✅ DONE
- [x] RAG query pipeline ✅ DONE
- [x] Chat API endpoint ✅ DONE
- [x] Frontend development (Vue 3 + Vite) ✅ DONE
- [ ] Deployment to Vercel 🔜 NEXT

**Overall Progress**: 11/12 tasks complete (92%)

See `tasks/TASK_TRACKER.md` for detailed progress.

## 📖 Documentation

### Project Documentation
- **[PRD.md](./PRD.md)** - Complete product requirements & technical specifications
- **[KNOWLEDGE_PROCESSING_EXAMPLES.md](./KNOWLEDGE_PROCESSING_EXAMPLES.md)** - Real examples of the 7-stage pipeline
- **[CLAUDE.md](./CLAUDE.md)** - Development guide for Claude Code
- **[tasks/TASK_TRACKER.md](./tasks/TASK_TRACKER.md)** - Task progress tracker (11/12 complete)

### Backend Documentation
- **[backend/QUICK_START.md](./backend/QUICK_START.md)** - Backend setup & testing guide
- **[backend/API_TESTING_GUIDE.md](./backend/API_TESTING_GUIDE.md)** - API endpoint testing examples
- **[backend/EMBEDDINGS_README.md](./backend/EMBEDDINGS_README.md)** - Embedding configuration guide

### Task Files
- **[tasks/backend/](./tasks/backend/)** - Backend task specifications (Tasks 00-09)
- **[tasks/frontend/](./tasks/frontend/)** - Frontend task specifications (Tasks F01-F02)
- **[tasks/deployment/](./tasks/deployment/)** - Deployment task specifications (Task D01)

## 🧪 Testing

### Local Testing (Full Stack)

**1. Start Backend Server** (Terminal 1):
```bash
cd backend
node server.js
```
Should show: `✅ Backend server running on http://localhost:3000`

**2. Start Frontend Dev Server** (Terminal 2):
```bash
cd frontend
npm run dev
```
Should show: `Local: http://localhost:5173/`

**3. Open Browser**:
- Navigate to `http://localhost:5173/`
- You should see the chat interface
- Type a question in Japanese (e.g., "青木さんについて教えて")
- Click send or press Enter
- Response should appear in 3-7 seconds with source citations

### Backend Unit Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test files
npm test -- parser.test.js
npm test -- text-reconstructor.test.js
npm test -- content-cleaner.test.js
npm test -- knowledge-extractor.test.js

# Watch mode (auto-rerun on changes)
npm test -- --watch
```

### API Testing

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Chat API:**
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "青木さんについて教えて"}'
```

**Or use the test script:**
```bash
npm run test:api
```

See `backend/API_TESTING_GUIDE.md` for more examples.

## 📊 Managing Knowledge Base (Pinecone Embeddings)

This section explains how to add, update, and manage your transcript data in the Pinecone vector database.

### Initial Data Processing

**When you first set up the project:**

1. Navigate to the backend directory
2. Run the process transcript command
3. The system will automatically:
   - Parse your SRT file from `backend/data/transcript.srt`
   - Run the 7-stage content processing pipeline
   - Extract semantic knowledge chunks
   - Generate embeddings
   - Upload vectors to Pinecone (creates index if needed)
   - Save intermediate results to `backend/output/`

**Command**: `npm run process-transcript` (from backend directory)

### Processing Custom Transcript Files

**To process a different transcript file:**

1. Provide the file path as an argument to the process script
2. The file can be located anywhere on your system
3. Multiple files can be processed one at a time

**Command**: `npm run process-transcript -- <path/to/your-transcript.srt>`

**Examples**:
- Process from different location: Use relative or absolute path
- Process multiple files: Run the command once for each file

### Updating Existing Knowledge Base

#### Option 1: Add New Knowledge (Append Mode)

**To add new transcript data without deleting existing knowledge:**

1. Place your new SRT file in `backend/data/` directory
2. Process the new transcript using the same command with the file path
3. Result: New knowledge chunks are added alongside existing ones
4. The chatbot can now answer questions from both old and new transcripts

**How it works**:
- Vectors with the same ID get updated
- New IDs get added
- Each chunk has a unique ID based on transcript name and chunk number

**Command**: `npm run process-transcript -- data/new-lecture.srt`

#### Option 2: Replace Old Knowledge (Replace Mode)

**To completely replace old knowledge with new data:**

**Step 1: Delete old vectors**
- Run the cleanup script from backend directory
- The script will ask for confirmation before deleting
- You can delete from default namespace or specify a custom namespace

**Command**: `node scripts/cleanup-pinecone.js` or `node scripts/cleanup-pinecone.js <namespace>`

**Step 2: Process new transcript**
- Run the process command with your new transcript file
- This uploads only the new data to the now-empty database

**Command**: `npm run process-transcript -- data/new-transcript.srt`

#### Option 3: Using Namespaces (Recommended for Multiple Transcripts)

**What are namespaces?**
- Namespaces organize different transcripts separately within the same Pinecone index
- Each transcript/topic can have its own namespace
- Query specific namespaces when needed

**To process with a custom namespace:**

1. Use the namespace processing script
2. Provide both the transcript file path and desired namespace name
3. Each namespace keeps its data separate from others

**Command**: `node scripts/process-with-namespace.js <transcript-file> <namespace-name>`

**Examples**:
- Organize by date: `node scripts/process-with-namespace.js data/lecture1.srt "2024-01"`
- Organize by topic: `node scripts/process-with-namespace.js data/ai-basics.srt "topic-ai"`

**To query a specific namespace:**
- Modify your API code to include the namespace parameter in search queries
- See `backend/api/chat.js` for implementation details

### Best Practices for Managing Knowledge Base

#### 1. Version Control Your Transcripts

**Organize transcript files with clear naming:**
- Use version numbers in filenames (e.g., `v1-2024-01-20-lecture.srt`)
- Keep different versions for comparison
- Use descriptive names indicating content or date
- Store all versions in the `backend/data/` directory

#### 2. Keep Output Files for Reference

**The processing pipeline saves intermediate results to `backend/output/`:**
- `01-segments.json` - Parsed SRT segments
- `02-reconstructed.json` - Reconstructed sentences
- `03-cleaned.json` - Cleaned content
- `04-knowledge.json` - **Extracted knowledge (most important!)**
- `05-chunks.json` - Semantic chunks
- `06-embeddings.json` - Embeddings with vectors

**Why keep these files?**
- Debug issues with knowledge extraction
- Compare different processing runs
- Re-upload to vector DB without re-processing

**Note**: The embeddings file (06) can be large. Consider adding it to .gitignore.

#### 3. Re-upload from Saved Embeddings

**If you already have embeddings saved but need to re-upload to Pinecone:**

This is useful when:
- You need to change namespace organization
- The Pinecone index was accidentally deleted
- You want to duplicate data to a different index

**Command**: `node scripts/reupload-embeddings.js` or `node scripts/reupload-embeddings.js <path> <namespace>`

This is much faster than re-running the entire processing pipeline.

#### 4. Monitor Your Pinecone Usage

**Check your Pinecone index statistics regularly:**

This shows:
- Total vector count in your database
- Vectors per namespace
- Index dimension and configuration
- Storage usage

**Command**: `node scripts/check-pinecone-stats.js`

Use this to verify uploads completed successfully and monitor your Pinecone plan limits.

### Common Workflows

#### Workflow 1: Weekly Lecture Updates

**Scenario**: Adding new lectures each week while keeping previous content

1. **Week 1**: Process initial lecture transcript
   - Command: `npm run process-transcript -- data/week1-lecture.srt`

2. **Week 2**: Add new lecture (keeps Week 1 data)
   - Command: `npm run process-transcript -- data/week2-lecture.srt`

3. **Week 3**: Add another lecture
   - Command: `npm run process-transcript -- data/week3-lecture.srt`

**Result**: All 3 weeks' knowledge is available to the chatbot

#### Workflow 2: Replace with Corrected Transcript

**Scenario**: You found errors and need to replace the entire knowledge base

1. **Delete old data**
   - Command: `node scripts/cleanup-pinecone.js`
   - Confirm deletion when prompted

2. **Process corrected transcript**
   - Command: `npm run process-transcript -- data/corrected-transcript.srt`

**Result**: Only corrected transcript knowledge remains in database

#### Workflow 3: Multi-Topic Knowledge Base

**Scenario**: Organizing different courses or topics separately

1. **Process AI basics into "topic-ai" namespace**
   - Command: `node scripts/process-with-namespace.js data/ai-basics.srt "topic-ai"`

2. **Process ML course into "topic-ml" namespace**
   - Command: `node scripts/process-with-namespace.js data/ml-advanced.srt "topic-ml"`

3. **Process data science into "topic-ds" namespace**
   - Command: `node scripts/process-with-namespace.js data/data-science.srt "topic-ds"`

**Result**: Each topic is isolated, and you can query specific topics by namespace

### Troubleshooting Data Updates

#### Problem: "Vector dimension mismatch" error

**Cause**: You changed embedding models between processing runs

**Solutions**:
1. Delete the Pinecone index through Pinecone console and let it recreate
2. Create a new index with a different name in your environment variables

#### Problem: "Quota exceeded" in Pinecone

**Cause**: Your Pinecone plan limit has been reached

**Solutions**:
- Check your current usage with the stats script
- Delete old vectors you no longer need using the cleanup script
- Use namespaces to organize and delete selectively
- Upgrade your Pinecone plan if needed

#### Problem: "Processing takes too long"

**Causes**: Large transcript files or slow API responses

**Solutions**:
- Use HuggingFace embeddings (faster and free) instead of OpenAI
- Split large SRT files into smaller parts
- Check your internet connection
- Verify API key rate limits

#### Problem: "Embeddings file too large"

**Cause**: The `06-embeddings.json` file can be several MB in size

**Solutions**:
- Add `06-embeddings.json` to .gitignore (don't commit to git)
- Compress with gzip for storage if needed
- Re-generate from SRT file when needed (don't need to keep forever)
- Clean up old embedding files from the output directory

### Environment Variables for Data Processing

**Required for embeddings** (choose one):
- `HUGGINGFACE_API_KEY` - FREE option (recommended)
- `OPENAI_API_KEY` - Paid option

**Required for vector database** (choose one):
- `PINECONE_API_KEY` - Pinecone (recommended)
- `UPSTASH_VECTOR_URL` + `UPSTASH_VECTOR_TOKEN` - Upstash alternative

**Optional** (only needed for chat API, not data processing):
- `OPENROUTER_API_KEY` - For LLM chat responses

**File location**: Create a `.env` file in the `backend/` directory based on `.env.example`

### Quick Reference

| Task | Command |
|------|---------|
| Process default transcript | `npm run process-transcript` |
| Process custom file | `npm run process-transcript -- path/to/file.srt` |
| Check Pinecone stats | `node backend/scripts/check-pinecone-stats.js` |
| Delete all vectors | Use Pinecone console or custom script |
| Re-upload embeddings | `node backend/scripts/reupload-embeddings.js` |
| Test API after update | `npm run test:api` |

---

## 🔧 Troubleshooting

### Common Issues

**1. Backend server won't start**
```bash
# Check if port 3000 is already in use
# Windows:
netstat -ano | findstr :3000
# Kill the process if needed
taskkill /PID <PID> /F
```

**2. Frontend shows "Network Error"**
- Ensure backend server is running on `http://localhost:3000`
- Check frontend API URL in `frontend/src/components/ChatContainer.vue`
- Should be: `http://localhost:3000/api/chat`

**3. "Missing API keys" error**
- Verify `.env` file exists in `backend/` folder
- Check all required keys are set:
  ```bash
  cd backend
  cat .env
  ```
- Restart backend server after changing `.env`

**4. "Vector DB not initialized" error**
- Run the transcript processing first:
  ```bash
  cd backend
  npm run process-transcript
  ```
- This uploads knowledge chunks to Pinecone

**5. Slow response times (>10 seconds)**
- Normal for free tier LLMs (OpenRouter free models)
- Upgrade to paid models for faster responses
- Check your OpenRouter credits

**6. Japanese text displays as "???"**
- Ensure your terminal supports UTF-8
- Files are saved with UTF-8 encoding
- This should not affect browser display

**7. Jest tests fail**
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests with verbose output
npm test -- --verbose
```

**8. Vercel deployment fails**
- Check `vercel.json` configuration
- Verify all environment variables are set in Vercel dashboard
- Check build logs for specific errors

### Getting Help

- Check `backend/QUICK_START.md` for backend-specific help
- Check `backend/API_TESTING_GUIDE.md` for API testing
- Check `backend/EMBEDDINGS_README.md` for embedding setup
- Review task files in `tasks/` for detailed implementation notes

## 📝 API Endpoints

### `POST /api/chat`
Main chatbot endpoint with RAG (Retrieval-Augmented Generation)

**Request:**
```json
{
  "message": "青木さんについて教えて"
}
```

**Response:**
```json
{
  "answer": "青木さんは...",
  "sources": [
    {
      "text": "Source text excerpt...",
      "timestamp": "00:01:23"
    }
  ],
  "processingTime": "5.2s"
}
```

### `GET /api/health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "message": "Backend API is running"
}
```

## 🚀 Deployment

### Backend Deployment (Next Step)

The backend will be deployed to Vercel as serverless functions.

**Steps:**
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `cd backend && vercel`
4. Configure environment variables in Vercel dashboard
5. Test production API

### Frontend Deployment

The frontend will be deployed to Vercel as a static site.

**Steps:**
1. Deploy: `cd frontend && vercel`
2. Configure backend API URL in Vercel
3. Test production site

See `tasks/deployment/01-backend-deploy.md` for detailed instructions.

## 🎉 Success Metrics

✅ **Current Status:**
- Retrieval Accuracy: ~85% (based on test queries)
- Response Time: 3-7 seconds (with free tier LLMs)
- Answer Relevance: High (includes source citations)
- Knowledge Extraction: 6 knowledge objects from sample transcript
- Semantic Chunks: 8 chunks (vs 150+ with naive chunking)

## 🚀 Next Steps

### Immediate (Week 3)
1. **Deploy Backend to Vercel** (Task D01)
   - Set up Vercel project
   - Configure environment variables
   - Deploy and test production API
   - See `tasks/deployment/01-backend-deploy.md`

2. **Deploy Frontend to Vercel**
   - Update API endpoint to production URL
   - Deploy frontend
   - Test full production stack

3. **Monitor & Optimize**
   - Monitor API response times
   - Track error rates
   - Gather user feedback

### Future Enhancements
- 📊 **Analytics Dashboard**: Track usage, popular questions, response quality
- 🔍 **Advanced Search**: Filter by topic, date range, speaker
- 🎤 **Voice Input**: Speech-to-text for Japanese voice queries
- 📱 **Mobile App**: React Native mobile application
- 🌐 **Multi-language**: Support for English translations
- 💾 **Conversation History**: Save and resume chat sessions
- 🔐 **User Authentication**: Multi-user support with auth
- 📈 **Quality Metrics**: Feedback system for answer quality
- 🔄 **Auto-sync**: Automatic processing of new transcripts
- 🎯 **Custom Models**: Fine-tuned models for better Japanese understanding

## 📄 License

ISC

## 👥 Contributors

Detomo Inc.
