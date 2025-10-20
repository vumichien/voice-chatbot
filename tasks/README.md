# Project Tasks

## Task Status Guide

Each task file contains:
- **Status**: `[ ] TODO` → `[~] IN_PROGRESS` → `[x] DONE`
- **Goals**: What this task achieves
- **Acceptance Criteria**: Must-have requirements
- **Testing Checklist**: How to verify quality
- **Dependencies**: What must be done first

## Task Organization

### Backend Tasks (tasks/backend/)
- **00-setup.md** - Project initialization
- **01-stage1-parser.md** - SRT parser
- **02-stage2-reconstructor.md** - Text reconstruction
- **03-stage3-cleaner.md** - Content cleaning
- **04-stage4-extractor.md** - Knowledge extraction
- **05-stage5-chunker.md** - Semantic chunking
- **06-stage6-embeddings.md** - Embedding generation
- **07-stage7-vectordb.md** - Vector DB operations
- **08-pipeline-orchestrator.md** - Pipeline orchestration
- **09-vector-db-setup.md** - Database setup
- **10-rag-pipeline.md** - RAG query pipeline
- **11-api-chat.md** - Chat API endpoint
- **12-api-other.md** - Health & Initialize APIs
- **13-testing.md** - Backend testing

### Frontend Tasks (tasks/frontend/)
- **01-setup.md** - Frontend setup
- **02-chat-container.md** - Main container component
- **03-message-list.md** - Message list component
- **04-message-bubble.md** - Message bubble component
- **05-input-box.md** - Input component
- **06-source-card.md** - Source citation component
- **07-api-integration.md** - API service layer
- **08-styling.md** - UI polish and responsiveness
- **09-testing.md** - Frontend testing

### Deployment Tasks (tasks/deployment/)
- **01-backend-deploy.md** - Backend to Vercel
- **02-frontend-deploy.md** - Frontend to Vercel
- **03-env-config.md** - Environment configuration
- **04-monitoring.md** - Logging and monitoring

## Progress Tracking

Update status in each task file:
```markdown
**Status**: [x] DONE
**Completed**: 2025-01-20
**Notes**: All tests passing
```

## How to Use

1. Read task file completely
2. Check dependencies are done
3. Update status to `[~] IN_PROGRESS`
4. Complete goals
5. Run all tests in checklist
6. Update status to `[x] DONE`
7. Move to next task

---

**Start with**: `tasks/backend/00-setup.md`
