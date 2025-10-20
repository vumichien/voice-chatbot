# Product Requirements Document (PRD)
## Voice Chatbot Project

---

## 1. Project Overview

### 1.1 Project Name
**AI-Powered Knowledge Chatbot**

### 1.2 Objective
Develop a full-stack chatbot application that can intelligently answer questions based on a Japanese transcript dataset. The system will use vector database technology and AI to provide accurate, context-aware responses.

### 1.3 Target Users
- End users seeking information from the transcript content
- Businesses wanting to deploy knowledge-based chatbots
- Researchers analyzing conversational AI systems

### 1.4 Success Criteria
- Chatbot accurately retrieves and answers questions from the transcript
- Response time < 3 seconds for 95% of queries
- System successfully deployed on Vercel
- Test accuracy rate > 85% for retrieval

---

## 2. Technical Architecture

### 2.1 System Architecture
```
┌─────────────┐      HTTPS       ┌──────────────┐      API        ┌─────────────┐
│             │ ◄────────────────► │              │ ◄───────────────►│             │
│   Vue.js    │                   │   Vercel     │                  │ OpenRouter  │
│   Frontend  │                   │   Backend    │                  │   API       │
│             │                   │   (Node.js)  │                  │  (GPT-4)    │
└─────────────┘                   └──────────────┘                  └─────────────┘
                                         │
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │   Vector DB   │
                                  │  (Pinecone/   │
                                  │   Upstash)    │
                                  └──────────────┘
```

### 2.2 Technology Stack

#### Frontend
- **Framework**: Vue.js 3 (Composition API)
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS
- **HTTP Client**: Axios
- **Hosting**: Vercel

#### Backend
- **Runtime**: Node.js (Vercel Serverless Functions)
- **Framework**: Express.js / Vercel API Routes
- **Vector Database**: Pinecone (Free tier) or Upstash Vector
- **Embedding Model**: text-embedding-3-small (OpenAI)
- **LLM**: openai/gpt-4o-mini-2024-07-18 via OpenRouter
- **Chunking**: LangChain.js
- **Hosting**: Vercel

---

## 3. Backend Requirements

### 3.1 Content Processing & Knowledge Extraction Pipeline

**IMPORTANT**: This pipeline transforms raw SRT transcripts into a structured, meaningful knowledge base. It is designed to be **reusable and scalable** for any transcript file.

---

#### 3.1.1 Stage 1: SRT Parsing & Cleaning

**Input**: `data/transcript.srt` file (raw subtitle format)

**Processing Steps**:
1. **Parse SRT Format**
   - Extract sequence numbers
   - Parse timestamps (start → end)
   - Extract text content
   - Handle UTF-8 Japanese encoding

2. **Initial Cleaning**
   - Remove empty lines
   - Trim whitespace
   - Detect and handle special characters
   - Identify speaker changes (if available)

**Output**: Array of raw segments
```javascript
[
  {
    id: 1,
    startTime: "00:00:00,160",
    endTime: "00:00:03,879",
    text: "本当に自分に責任があるという反省がない",
    duration: 3.719
  },
  // ...
]
```

**Code Location**: `lib/parser.js`

---

#### 3.1.2 Stage 2: Text Reconstruction & Sentence Assembly

**Problem**: SRT files break text mid-sentence for subtitle display. We need to reconstruct complete, coherent sentences.

**Processing Steps**:

1. **Sentence Boundary Detection**
   - Identify Japanese sentence endings: 。！？、など
   - Detect incomplete fragments (no ending punctuation)
   - Use NLP to identify sentence completeness

2. **Fragment Merging**
   - Concatenate broken sentences across segments
   - Preserve original timestamp ranges
   - Example:
     ```
     Segment 7: "人を"
     Segment 8: "変えようということ自体しない方がいいと"
     → Merged: "人を変えようということ自体しない方がいいと思う。"
     ```

3. **Paragraph Formation**
   - Group related sentences by topic continuity
   - Use silence gaps (>2 seconds) as paragraph breaks
   - Preserve speaker turns

**Output**: Reconstructed paragraphs
```javascript
[
  {
    paragraphId: 1,
    sentences: [
      "人間ってやっぱり変わらないんだよ。",
      "人を変えようということ自体しない方がいいと思う。"
    ],
    fullText: "人間ってやっぱり変わらないんだよ。人を変えようということ自体しない方がいいと思う。",
    startTime: "00:00:03,879",
    endTime: "00:00:28,120",
    segmentIds: [2, 3, 4, ...8]
  }
]
```

**Libraries**:
- `kuromoji` - Japanese morphological analysis
- `budoux` - Japanese line breaking

**Code Location**: `lib/text-reconstructor.js`

---

#### 3.1.3 Stage 3: Content Cleaning & Normalization

**Processing Steps**:

1. **Transcription Error Correction**
   - Fix common OCR/ASR errors
   - Normalize character variants (全角/半角)
   - Correct obvious typos using dictionary lookup
   - Example corrections:
     - "青木サ" → "青木さん"
     - "警額" → "経験"
     - "味噌をする" → "過ちをする" (context-dependent)

2. **Text Normalization**
   - Standardize punctuation
   - Normalize numbers (e.g., "100万" vs "百万")
   - Remove filler words (optional): "ま、", "あの、", "えー"
   - Remove non-verbal markers: "[音楽]", "[拍手]"

3. **Quality Filtering**
   - Remove segments with too many errors
   - Flag low-confidence transcriptions
   - Mark noise/music segments for exclusion

**Output**: Clean paragraphs ready for knowledge extraction

**Code Location**: `lib/content-cleaner.js`

---

#### 3.1.4 Stage 4: Knowledge Extraction & Structuring

**Goal**: Transform conversational transcript into structured knowledge chunks with semantic meaning.

**Processing Steps**:

1. **Topic Segmentation**
   - Use NLP to identify topic boundaries
   - Detect topic shifts in conversation
   - Group paragraphs by theme
   - Topics in this transcript:
     - "誠実さと人間関係" (Sincerity and relationships)
     - "人を変えることの是非" (Changing people)
     - "価値観の合わない人との距離" (Distancing from incompatible values)
     - "黄金率と人生の価値観" (Golden Rule and life values)
     - "時間管理と優先順位" (Time management and priorities)

2. **Key Concept Extraction**
   - Identify main ideas, quotes, and teachings
   - Extract named entities:
     - People: 青木さん, 野中郁次郎先生, 竹沢さん
     - Organizations: アチューメント, 東京会館
     - Concepts: 黄金率, 誠実, 信用, クオリティワールド
   - Identify important quotes:
     - "何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい"
     - "信用ってね、無型の資本なんです"

3. **Fact & Insight Extraction**
   - Timeline events: "29歳でバイブルと出会って"
   - Personal anecdotes: "親友から100万借りて返せなかった"
   - Principles & advice: "価値観が合わない人とは付き合わない"

4. **Question-Answer Pair Generation**
   - Auto-generate potential Q&A pairs
   - Useful for testing and search optimization
   - Example:
     ```
     Q: "青木さんが29歳で出会ったものは？"
     A: "バイブル（聖書）で、そこで黄金率の教えに出会いました。"
     ```

**Output**: Structured knowledge objects
```javascript
[
  {
    knowledgeId: "k001",
    topic: "黄金率と価値観",
    type: "principle",
    content: {
      main: "何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい。これがマタイ7章12節の黄金率の教えで、青木さんは29歳でこの価値観に出会い、人生が変わりました。",
      context: "青木さんは若い時は不誠実でお金も返せない人間でしたが、バイブルと出会って黄金率を知り、全ての意思決定の基準にしました。",
      quotes: [
        "何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい"
      ]
    },
    entities: {
      people: ["青木"],
      concepts: ["黄金率", "バイブル", "マタイ7章12節"],
      ages: [29]
    },
    timestamp: {
      start: "00:01:19,320",
      end: "00:01:44,880"
    },
    metadata: {
      importance: "high",
      category: "life_philosophy",
      sentiment: "inspirational"
    }
  },
  {
    knowledgeId: "k002",
    topic: "人間関係の原則",
    type: "advice",
    content: {
      main: "価値観が根本的に合わない人とは付き合ってはダメ。人を変えようとせず、離れる方が楽。そのままで受け入れられる人と良い関係ができる。",
      context: "人間は変わりたくなるように導くことはできても、変えようとするのは傲慢。特に不誠実な人とは距離を置くべき。",
      quotes: [
        "人を変えようということ自体しない方がいいと思う",
        "そのままで受け入れられる人と良い関係ができる"
      ]
    },
    entities: {
      concepts: ["価値観", "誠実", "人間関係", "距離"]
    },
    timestamp: {
      start: "00:04:30,919",
      end: "00:06:12,120"
    },
    metadata: {
      importance: "high",
      category: "relationships",
      sentiment: "practical_advice"
    }
  }
]
```

**Libraries**:
- Custom NLP pipeline
- `openai` API for concept extraction (optional, for high-quality results)

**Code Location**: `lib/knowledge-extractor.js`

---

#### 3.1.5 Stage 5: Intelligent Chunking for Vector DB

**Strategy**: Instead of naive character-based chunking, use **semantic chunking** based on knowledge structure.

**Chunking Approaches**:

1. **Knowledge-Based Chunks** (Primary)
   - Each knowledge object = 1 chunk
   - Preserve semantic coherence
   - Variable size (200-1000 chars)
   - Include rich metadata

2. **Hierarchical Chunks** (Secondary)
   - Topic-level summaries (large chunks)
   - Detailed explanations (medium chunks)
   - Specific quotes (small chunks)

3. **Overlapping Context**
   - Add previous/next topic context
   - Include speaker information
   - Add temporal context (what was discussed before/after)

**Chunk Structure**:
```javascript
{
  chunkId: "chunk_001",
  type: "knowledge",
  content: "青木さんは29歳でバイブルと出会い、黄金率（何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい）という価値観に目覚めました。これはマタイ7章12節の教えで、以降全ての意思決定の基準となりました。",

  metadata: {
    topic: "黄金率と価値観",
    entities: ["青木", "バイブル", "黄金率", "マタイ7章12節"],
    concepts: ["価値観", "意思決定", "人生哲学"],
    timestamp: "00:01:19,320 --> 00:01:44,880",
    importance: "high",
    category: "life_philosophy",

    // For better retrieval
    keywords: ["黄金率", "29歳", "バイブル", "価値観", "人生"],
    contextBefore: "若い時の不誠実な自分を猛省した経験",
    contextAfter: "人材教育の仕事を始めた経緯",

    // Original source
    segmentIds: [26, 27, 28, 29, 30, 31, 32],
    language: "ja"
  }
}
```

**Parameters**:
- Min chunk size: 200 characters
- Max chunk size: 1000 characters
- Overlap strategy: Topic context (not character-based)
- Total estimated chunks: 40-60 (vs 150+ with naive chunking)

**Benefits**:
- Better retrieval accuracy
- More coherent context for LLM
- Reduced storage costs
- Faster search

**Code Location**: `lib/semantic-chunker.js`

---

#### 3.1.6 Stage 6: Embedding Generation with Enhanced Metadata

**Model**: `text-embedding-3-small` (OpenAI)
- **Dimensions**: 1536
- **Cost**: $0.02 / 1M tokens (~$0.001 for this transcript)

**Process**:
1. **Text Preparation**
   - Combine content + topic + key entities for embedding
   - Example input: `"Topic: 黄金率と価値観\n\n青木さんは29歳で..."`
   - This improves semantic search quality

2. **Batch Processing**
   - Process chunks in batches of 100
   - Retry logic for API failures
   - Progress tracking

3. **Metadata Enrichment**
   - Add embedding vector
   - Calculate text statistics (length, word count)
   - Generate search keywords

**Output**: Embedding-ready chunks
```javascript
{
  chunkId: "chunk_001",
  content: "...",
  embedding: [0.023, -0.015, 0.041, ...], // 1536 dimensions
  metadata: { /* ... */ }
}
```

**Code Location**: `lib/embeddings.js`

---

#### 3.1.7 Stage 7: Vector Database Upload

**Database**: Pinecone or Upstash Vector

**Index Configuration**:
```javascript
{
  name: "transcript-knowledge",
  dimension: 1536,
  metric: "cosine",
  pods: 1,
  pod_type: "s1.x1" // Free tier
}
```

**Upload Process**:
1. Batch upload (100 vectors per request)
2. Include all metadata for filtering
3. Create namespace per transcript file (for scalability)

**Vector Structure in DB**:
```javascript
{
  id: "chunk_001",
  values: [0.023, -0.015, ...], // embedding vector
  metadata: {
    content: "青木さんは29歳で...",
    topic: "黄金率と価値観",
    entities: ["青木", "バイブル", "黄金率"],
    timestamp: "00:01:19,320 --> 00:01:44,880",
    importance: "high",
    category: "life_philosophy",
    transcriptFile: "transcript_001.srt", // For multi-file support
    uploadDate: "2025-01-19T10:00:00Z"
  }
}
```

**Code Location**: `lib/vectordb.js`

---

#### 3.1.8 Pipeline Orchestration & Configuration

**Main Pipeline File**: `lib/content-pipeline.js`

```javascript
class ContentPipeline {
  async processTranscript(srtFilePath, options = {}) {
    const config = {
      language: options.language || 'ja',
      enableCleaning: options.enableCleaning ?? true,
      enableErrorCorrection: options.enableErrorCorrection ?? true,
      chunkingStrategy: options.chunkingStrategy || 'knowledge-based',
      extractKeywords: options.extractKeywords ?? true,
      generateQA: options.generateQA ?? false,
      ...options
    }

    // Stage 1: Parse SRT
    const rawSegments = await this.parseSRT(srtFilePath)

    // Stage 2: Reconstruct sentences
    const paragraphs = await this.reconstructText(rawSegments)

    // Stage 3: Clean content
    const cleanedContent = await this.cleanContent(paragraphs, config)

    // Stage 4: Extract knowledge
    const knowledge = await this.extractKnowledge(cleanedContent, config)

    // Stage 5: Create chunks
    const chunks = await this.createChunks(knowledge, config)

    // Stage 6: Generate embeddings
    const embeddings = await this.generateEmbeddings(chunks)

    // Stage 7: Upload to vector DB
    const uploadResult = await this.uploadToVectorDB(embeddings)

    return {
      success: true,
      stats: {
        rawSegments: rawSegments.length,
        paragraphs: paragraphs.length,
        knowledgeObjects: knowledge.length,
        chunks: chunks.length,
        uploaded: uploadResult.count
      },
      knowledge, // Return for inspection
      chunks
    }
  }
}
```

**Usage**:
```javascript
const pipeline = new ContentPipeline()
const result = await pipeline.processTranscript('./data/transcript.srt', {
  language: 'ja',
  chunkingStrategy: 'knowledge-based',
  enableErrorCorrection: true
})

console.log(`Processed ${result.stats.chunks} knowledge chunks`)
```

---

#### 3.1.9 Example: Raw SRT → Processed Knowledge

**Input (Raw SRT fragments)**:
```
26
00:01:19,320 --> 00:01:22,119
29歳でバイブルと出会ってね、そこで

27
00:01:22,119 --> 00:01:26,360
黄金率何事でも人々からして欲しいと望む

28
00:01:26,360 --> 00:01:29,920
通りのことを他の人々にもそのようにし

29
00:01:29,920 --> 00:01:33,399
なさいとね。これマタで7章12節の
```

**Stage 2 Output (Reconstructed)**:
```javascript
{
  paragraph: "29歳でバイブルと出会ってね、そこで黄金率何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさいとね。これマタイ7章12節の御言葉なんだけど...",
  timeRange: "00:01:19,320 --> 00:01:36,880"
}
```

**Stage 3 Output (Cleaned)**:
```javascript
{
  paragraph: "29歳でバイブルと出会って、そこで黄金率「何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい」という教えを知りました。これはマタイ7章12節の御言葉です。",
  corrections: [
    { original: "マタで", corrected: "マタイ", position: 87 }
  ]
}
```

**Stage 4 Output (Knowledge Extracted)**:
```javascript
{
  knowledgeId: "k001",
  topic: "黄金率との出会い",
  type: "biographical_event",
  mainContent: "青木さんは29歳でバイブルと出会い、黄金率の教えを知りました。",
  detailedContent: "黄金率とは「何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい」というマタイ7章12節の教えです。",
  entities: {
    people: ["青木"],
    age: 29,
    concepts: ["黄金率", "バイブル"],
    references: ["マタイ7章12節"]
  },
  importance: "high"
}
```

**Stage 5 Output (Chunked for Vector DB)**:
```javascript
{
  chunkId: "chunk_001",
  content: "【黄金率との出会い】青木さんは29歳でバイブルと出会い、黄金率の教えを学びました。黄金率とは「何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい」というマタイ7章12節の教えです。この価値観が以降の人生における全ての意思決定の基準となりました。",
  metadata: {
    topic: "黄金率と価値観",
    keywords: ["29歳", "バイブル", "黄金率", "マタイ7章12節", "価値観", "意思決定"],
    entities: ["青木", "バイブル", "黄金率"],
    timestamp: "00:01:19,320 --> 00:01:44,880",
    importance: "high",
    category: "life_philosophy"
  }
}
```

This structured approach produces **high-quality, semantically meaningful chunks** that dramatically improve retrieval accuracy and LLM response quality.

---

### 3.2 Scalability for Multiple Transcripts

**Design Principles**:
1. **File-agnostic processing**: Works with any SRT file
2. **Namespace isolation**: Each transcript in separate vector DB namespace
3. **Metadata tagging**: Track source file for all chunks
4. **Batch processing**: Process multiple files in parallel

**Multi-File Support**:
```javascript
// Process multiple transcripts
const transcripts = [
  './data/transcript_001.srt',
  './data/transcript_002.srt',
  './data/transcript_003.srt'
]

for (const file of transcripts) {
  await pipeline.processTranscript(file, {
    namespace: path.basename(file, '.srt'), // transcript_001
    metadata: {
      source: file,
      uploadedAt: new Date().toISOString()
    }
  })
}
```

**Querying Across Transcripts**:
```javascript
// Search in specific transcript
const results = await vectorDB.query({
  vector: queryEmbedding,
  topK: 5,
  namespace: 'transcript_001'
})

// Search across all transcripts
const globalResults = await vectorDB.query({
  vector: queryEmbedding,
  topK: 5
  // No namespace = search all
})
```

---

### 3.3 API Endpoints

#### 3.3.1 POST /api/chat
**Purpose**: Main chatbot endpoint

**Request**:
```json
{
  "message": "ユーザーの質問",
  "conversationId": "optional-uuid",
  "language": "ja"
}
```

**Response**:
```json
{
  "response": "AIの回答",
  "sources": [
    {
      "text": "関連するテキスト",
      "timestamp": "00:01:05,280 --> 00:01:08,159",
      "relevanceScore": 0.92
    }
  ],
  "conversationId": "uuid"
}
```

#### 3.3.2 GET /api/health
**Purpose**: Health check endpoint

**Response**:
```json
{
  "status": "healthy",
  "vectorDb": "connected",
  "timestamp": "2025-01-19T10:00:00Z"
}
```

#### 3.3.3 POST /api/initialize
**Purpose**: Initialize/rebuild vector database (admin)

**Request**:
```json
{
  "adminKey": "secret-key"
}
```

**Response**:
```json
{
  "status": "success",
  "chunksProcessed": 150,
  "embeddingsCreated": 150
}
```

### 3.4 RAG (Retrieval-Augmented Generation) Pipeline

#### Step 1: Query Processing
- Receive user question
- Generate query embedding
- Detect language (Japanese/English)

#### Step 2: Vector Search
- Search top K=5 similar chunks
- Similarity threshold: > 0.7
- Return with metadata

#### Step 3: Context Construction
- Combine retrieved chunks
- Add timestamp references
- Format for LLM consumption

#### Step 4: LLM Generation
- Use OpenRouter API
- Model: openai/gpt-4o-mini-2024-07-18
- System prompt with instructions
- Include retrieved context

#### Step 5: Response Formatting
- Parse LLM response
- Add source citations
- Return to frontend

### 3.5 Testing Requirements

#### 3.5.1 Test Dataset Creation
Create 20+ test questions covering:
- Direct fact retrieval
- Conceptual understanding
- Multi-hop reasoning
- Paraphrased queries

**Example Test Cases**:
```json
[
  {
    "question": "青木さんが29歳の時に出会ったものは何ですか？",
    "expectedAnswer": "バイブル（聖書）",
    "expectedSource": "00:01:19,320 --> 00:01:22,119"
  },
  {
    "question": "黄金率とは何ですか？",
    "expectedAnswer": "何事でも人々からして欲しいと望む通りのことを他の人々にもそのようにしなさい",
    "expectedSource": "00:01:26,360 --> 00:01:33,399"
  }
]
```

#### 3.5.2 Evaluation Metrics
- **Retrieval Accuracy**: % of correct source retrieval
- **Answer Relevance**: Manual scoring 1-5
- **Response Time**: Average latency
- **Success Rate**: % of valid responses

#### 3.5.3 Automated Tests
- Unit tests for chunking logic
- Integration tests for API endpoints
- E2E tests for complete RAG pipeline

---

## 4. Frontend Requirements

### 4.1 User Interface Design

#### 4.1.1 Layout
```
┌─────────────────────────────────────────┐
│  Header: AI Knowledge Chatbot           │
├─────────────────────────────────────────┤
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Chat Messages Area                │ │
│  │                                    │ │
│  │  [AI Avatar] こんにちは！質問を...│ │
│  │                                    │ │
│  │  [User] 青木さんについて教えて    │ │
│  │                                    │ │
│  │  [AI Avatar] 青木さんは29歳で... │ │
│  │  📎 Sources: 00:01:19,320         │ │
│  │                                    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ Type your question...         [Send]│ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 4.1.2 Components

**ChatContainer**
- Main wrapper component
- Manages conversation state
- Handles API calls

**MessageList**
- Displays conversation history
- Auto-scrolls to latest message
- Shows loading indicators

**MessageBubble**
- User messages (right-aligned, blue)
- AI messages (left-aligned, gray)
- Source citations (collapsible)

**InputBox**
- Text input field
- Send button
- Character counter
- Disabled during loading

**SourceCard**
- Display transcript source
- Show timestamp
- Relevance score indicator

### 4.2 Features

#### 4.2.1 Core Features
- Real-time chat interface
- Message history (session-based)
- Source citation display
- Loading states
- Error handling
- Responsive design (mobile-first)

#### 4.2.2 Optional Features
- Copy message to clipboard
- Clear conversation
- Dark mode toggle
- Language selector (JP/EN)
- Example questions

### 4.3 State Management
- Use Vue 3 Composition API with `ref` and `reactive`
- Store conversation history in component state
- Persist conversationId in sessionStorage

### 4.4 API Integration
```javascript
// API Service
const API_BASE = import.meta.env.VITE_API_URL || '/api'

async function sendMessage(message, conversationId) {
  const response = await axios.post(`${API_BASE}/chat`, {
    message,
    conversationId,
    language: 'ja'
  })
  return response.data
}
```

---

## 5. Implementation Steps

### 5.1 Backend Implementation (Week 1-2)

#### Phase 1: Setup & Content Processing Pipeline
**Days 1-3**
1. Initialize Node.js project
2. Setup Vercel configuration
3. Install dependencies (LangChain, OpenAI SDK, Pinecone/Upstash, kuromoji, budoux, srt-parser)
4. **Stage 1**: Create SRT parser (`lib/parser.js`)
5. **Stage 2**: Implement text reconstructor (`lib/text-reconstructor.js`)
6. **Stage 3**: Implement content cleaner (`lib/content-cleaner.js`)
7. **Stage 4**: Implement knowledge extractor (`lib/knowledge-extractor.js`)
8. **Stage 5**: Implement semantic chunker (`lib/semantic-chunker.js`)
9. **Stage 6**: Implement embeddings generator (`lib/embeddings.js`)
10. **Stage 7**: Create vector DB module (`lib/vectordb.js`)
11. Create pipeline orchestrator (`lib/content-pipeline.js`)
12. Test each stage independently
13. Test full pipeline with transcript.srt

#### Phase 2: Vector Database & Knowledge Population
**Days 4-5**
14. Setup Pinecone/Upstash account
15. Create vector index with proper configuration
16. Run full content pipeline on transcript.srt
17. Verify knowledge extraction quality
18. Upload processed chunks to vector database
19. Test vector search queries
20. Verify retrieval accuracy with sample queries
21. Create processed knowledge cache files

#### Phase 3: API Development
**Days 6-8**
22. Create Express/Vercel API routes
23. Implement /api/chat endpoint with RAG pipeline
24. Implement /api/health endpoint
25. Implement /api/initialize endpoint (admin)
26. Integrate OpenRouter API for LLM responses
27. Add comprehensive error handling
28. Implement request validation
29. Test API endpoints locally
30. Add rate limiting and security

#### Phase 4: Testing & Optimization
**Days 9-10**
31. Create comprehensive test dataset (20+ questions in Japanese)
32. Run retrieval accuracy tests
33. Measure response quality and relevance
34. Test knowledge extraction quality manually
35. Optimize system prompts for better responses
36. Tune vector search parameters (topK, threshold)
37. Performance testing and optimization
38. Document test results and metrics
39. Fix bugs and edge cases

### 5.2 Frontend Implementation (Week 2-3)

#### Phase 1: Setup
**Days 11-12**
1. Initialize Vue 3 + Vite project
2. Setup Tailwind CSS
3. Configure Vercel deployment
4. Create project structure

#### Phase 2: UI Development
**Days 13-15**
5. Build ChatContainer component
6. Build MessageList component
7. Build MessageBubble component
8. Build InputBox component
9. Build SourceCard component
10. Add responsive styles

#### Phase 3: Integration
**Days 16-17**
11. Implement API service layer
12. Connect components to backend
13. Add loading states
14. Implement error handling
15. Add message persistence

#### Phase 4: Polish
**Days 18-19**
16. Test on mobile devices
17. Add animations/transitions
18. Optimize performance
19. Add example questions
20. Final QA testing

### 5.3 Deployment (Day 20)
1. Deploy backend to Vercel
2. Deploy frontend to Vercel
3. Configure environment variables
4. Test production deployment
5. Monitor logs and errors

---

## 6. File Structure

### 6.1 Backend Structure
```
voice-chatbot/
├── api/
│   ├── chat.js              # Main chat endpoint
│   ├── health.js            # Health check
│   └── initialize.js        # DB initialization
├── lib/
│   ├── parser.js            # SRT parser (Stage 1)
│   ├── text-reconstructor.js  # Sentence reconstruction (Stage 2)
│   ├── content-cleaner.js   # Text cleaning & normalization (Stage 3)
│   ├── knowledge-extractor.js # Knowledge extraction (Stage 4)
│   ├── semantic-chunker.js  # Intelligent chunking (Stage 5)
│   ├── embeddings.js        # Embedding generation (Stage 6)
│   ├── vectordb.js          # Vector DB operations (Stage 7)
│   ├── content-pipeline.js  # Orchestration (Stage 1-7)
│   └── rag.js               # RAG pipeline for queries
├── tests/
│   ├── test-questions.json  # Test dataset
│   ├── parser.test.js
│   ├── text-reconstructor.test.js
│   ├── content-cleaner.test.js
│   ├── knowledge-extractor.test.js
│   ├── chunker.test.js
│   └── rag.test.js
├── data/
│   ├── transcript.srt       # Source data (original)
│   ├── transcript_001.srt   # Additional transcripts
│   └── processed/           # Processed knowledge (cache)
│       ├── transcript_knowledge.json
│       └── transcript_chunks.json
├── scripts/
│   ├── setup-db.js          # Initial DB setup
│   ├── process-transcript.js  # Run content pipeline
│   └── test-retrieval.js    # Test retrieval accuracy
├── package.json
├── vercel.json              # Vercel config
└── .env.example
```

### 6.2 Frontend Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── ChatContainer.vue
│   │   ├── MessageList.vue
│   │   ├── MessageBubble.vue
│   │   ├── InputBox.vue
│   │   └── SourceCard.vue
│   ├── services/
│   │   └── api.js           # API client
│   ├── composables/
│   │   └── useChat.js       # Chat logic
│   ├── App.vue
│   └── main.js
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── vercel.json
```

---

## 7. Environment Variables

### 7.1 Backend (.env)
```bash
# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_key

# Vector Database (choose one)
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX_NAME=transcript-knowledge
PINECONE_ENVIRONMENT=us-east-1

# OR
UPSTASH_VECTOR_URL=your_upstash_url
UPSTASH_VECTOR_TOKEN=your_upstash_token

# OpenAI for embeddings
OPENAI_API_KEY=your_openai_key

# Admin
ADMIN_KEY=your_secret_admin_key
```

### 7.2 Frontend (.env)
```bash
VITE_API_URL=https://your-backend.vercel.app/api
```

---

## 8. Testing Strategy

### 8.1 Backend Tests
- **Unit Tests**: Parser, chunker, embeddings (80% coverage)
- **Integration Tests**: API endpoints, vector DB operations
- **E2E Tests**: Complete RAG pipeline with test questions

### 8.2 Frontend Tests
- **Component Tests**: Vue component rendering
- **Integration Tests**: API service layer
- **E2E Tests**: User flow with Playwright

### 8.3 Performance Tests
- Load testing: 100 concurrent users
- Response time: < 3s for 95th percentile
- Vector search: < 500ms

---

## 9. Deployment Configuration

### 9.1 Backend Vercel.json
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

### 9.2 Frontend Vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

---

## 10. Success Metrics & KPIs

### 10.1 Technical Metrics
- **Retrieval Accuracy**: > 85%
- **Response Time**: < 3 seconds (p95)
- **Uptime**: > 99%
- **Error Rate**: < 1%

### 10.2 Quality Metrics
- **Answer Relevance**: > 4/5 (user ratings)
- **Source Accuracy**: > 90%
- **User Satisfaction**: > 4/5

### 10.3 Performance Metrics
- **Vector Search Latency**: < 500ms
- **LLM Response Time**: < 2s
- **Frontend Load Time**: < 1s

---

## 11. Risk Management

### 11.1 Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| API rate limits | High | Implement caching, request queuing |
| Vector DB costs | Medium | Use free tier, optimize chunk count |
| Vercel timeout (10s) | High | Optimize pipeline, use streaming |
| LLM hallucination | Medium | Strong system prompts, source validation |

### 11.2 Data Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor chunking quality | High | Test multiple strategies, manual review |
| Low retrieval accuracy | High | Tune embedding model, adjust chunk size |
| Japanese text encoding | Medium | UTF-8 validation, proper parsing |

---

## 12. Future Enhancements

### 12.1 Phase 2 Features
- Multi-file upload support
- Conversation memory (Redis)
- User authentication
- Analytics dashboard
- Export conversation history

### 12.2 Phase 3 Features
- Multi-language support (EN, JP, CN)
- Voice input/output
- Video timestamp linking
- Admin panel for content management
- A/B testing framework

---

## 13. Timeline & Milestones

### Week 1
- ✅ PRD completion
- ✅ Environment setup
- 🎯 Backend data pipeline complete
- 🎯 Vector DB populated

### Week 2
- 🎯 Backend API complete
- 🎯 Testing framework ready
- 🎯 Frontend UI built

### Week 3
- 🎯 Integration complete
- 🎯 Testing passed
- 🎯 Production deployment
- 🎯 Documentation complete

---

## 14. Appendix

### 14.1 Key Libraries

**Backend**:
- `@langchain/core` - Text processing
- `@langchain/openai` - Embeddings
- `@pinecone-database/pinecone` - Vector DB (or `@upstash/vector`)
- `openai` - OpenAI API for embeddings & optional knowledge extraction
- `axios` - HTTP client
- `dotenv` - Environment variables
- `kuromoji` - Japanese morphological analysis
- `budoux` - Japanese line breaking
- `subsrt-ts` or `srt-parser-2` - SRT file parsing

**Frontend**:
- `vue` v3.4+
- `axios` - HTTP client
- `tailwindcss` - Styling
- `vite` - Build tool

### 14.2 API Documentation References
- OpenRouter: https://openrouter.ai/docs
- Pinecone: https://docs.pinecone.io
- OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings
- Vercel: https://vercel.com/docs

---

## 15. Approval & Sign-off

**Document Version**: 1.0
**Created**: 2025-01-19
**Status**: Draft → Review → Approved

**Stakeholders**:
- [ ] Product Owner
- [ ] Technical Lead
- [ ] Frontend Developer
- [ ] Backend Developer

---

**End of PRD**
