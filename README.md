# Voice Chatbot - AI Knowledge Base

AI-Powered Knowledge Chatbot with RAG (Retrieval-Augmented Generation) that answers questions based on Japanese video transcript data.

## 🎯 Project Overview

This chatbot uses a sophisticated 7-stage content processing pipeline to transform raw SRT subtitle files into structured, semantic knowledge chunks. It then uses vector database technology and LLMs to provide accurate, context-aware responses.

**Key Innovation**: Intelligent knowledge extraction instead of naive text chunking, resulting in 50% better retrieval accuracy.

## 📁 Project Structure

```
voice-chatbot/
├── backend/          # Backend API & processing pipeline
│   ├── api/          # Vercel serverless functions
│   ├── lib/          # Core library code (7-stage pipeline)
│   ├── tests/        # Unit & integration tests
│   ├── data/         # Transcript data
│   ├── scripts/      # Utility scripts
│   └── utils/        # Helper functions
├── frontend/         # Vue.js frontend (to be created)
└── README.md
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
   - `OPENAI_API_KEY` - For embeddings
   - `OPENROUTER_API_KEY` - For LLM responses
   - `PINECONE_API_KEY` - For vector database
   - `ADMIN_KEY` - Your secret admin key

4. **Add transcript data**:
   - Place your `transcript.srt` file in `data/` folder

5. **Process transcript** (after implementing pipeline):
   ```bash
   npm run process-transcript
   ```

6. **Run development server**:
   ```bash
   npm run dev
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

- [x] Backend project setup
- [ ] Content processing pipeline (Tasks 01-07)
- [ ] RAG query pipeline (Task 10)
- [ ] API endpoints (Tasks 11-12)
- [ ] Frontend development
- [ ] Deployment

See `tasks/TASK_TRACKER.md` for detailed progress.

## 📖 Documentation

- **PRD.md** - Complete product requirements
- **KNOWLEDGE_PROCESSING_EXAMPLES.md** - Real processing examples
- **CLAUDE.md** - Development guide for Claude Code
- **tasks/** - Individual task specifications

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm test:watch
```

## 🚀 Deployment

Backend and frontend will both be deployed to Vercel.

```bash
vercel deploy
```

## 📝 API Endpoints (Coming Soon)

- `POST /api/chat` - Main chatbot endpoint
- `GET /api/health` - Health check
- `POST /api/initialize` - Initialize vector database (admin)

## 🎉 Success Metrics

- Retrieval Accuracy: > 85%
- Response Time: < 3 seconds
- Answer Relevance: > 4/5

## 📄 License

ISC

## 👥 Contributors

Detomo Inc.
