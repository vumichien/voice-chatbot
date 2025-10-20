# CLAUDE Code - Project Execution Guide

**Project**: Voice Chatbot Knowledge Base
**Type**: AI Chatbot with RAG (Retrieval-Augmented Generation)
**Tech Stack**: Node.js, Vue 3, Vector DB, OpenRouter LLM
**Deployment**: Vercel (Full-stack)

---

## ⚠️ IMPORTANT: Context Management

**Before starting ANY task, Claude MUST check context:**

```
Current context usage: [X] tokens / 200,000 tokens
Remaining: [Y] tokens

IF remaining < 30,000 tokens:
  → STOP and ask user: "Context is running low. Should I compact the conversation before continuing?"
```

**Why**: This project has extensive documentation. Running out of context mid-task will cause incomplete work.

---

## 📋 Project Overview

### What We're Building
An AI chatbot that answers questions about 青木さん's teachings from a Japanese video transcript. The system:
1. Processes raw SRT subtitle files
2. Extracts meaningful knowledge (not just text chunks!)
3. Stores in vector database
4. Uses RAG to answer questions accurately

### Key Innovation
**Intelligent Knowledge Extraction** instead of naive text chunking:
- Reconstructs broken sentences from SRT fragments
- Extracts topics, entities, quotes, principles
- Creates semantic chunks (40-60 vs 150+ naive chunks)
- 50% better retrieval accuracy

---

## 📚 Essential Documents

### 1. PRD.md (Product Requirements Document)
- **READ FIRST** before any implementation
- Contains complete technical specification
- 7-stage content processing pipeline
- API specifications
- Deployment configuration

### 2. KNOWLEDGE_PROCESSING_EXAMPLES.md
- Real examples of processing pipeline
- Shows raw SRT → final knowledge chunks
- Use as reference during implementation

### 3. tasks/TASK_TRACKER.md
- **Your execution roadmap**
- 26 tasks organized by phase
- Track progress here
- Update after completing each task

### 4. tasks/HOW_TO_USE_TASKS.md
- How to work through tasks systematically
- Quality assurance guidelines
- Best practices

---

## 🚀 Execution Workflow

### Step 1: Read & Understand (30 minutes)

**Claude should do this FIRST:**

1. **Read PRD.md** (Section 3.1 is critical - Content Processing Pipeline)
2. **Read KNOWLEDGE_PROCESSING_EXAMPLES.md** (understand expected output quality)
3. **Read tasks/TASK_TRACKER.md** (see all 26 tasks)
4. **Confirm understanding with user**:
   ```
   "I've reviewed the PRD. This project builds a knowledge-based chatbot
   with a 7-stage processing pipeline. Ready to start with Task 00: Backend Setup?"
   ```

### Step 2: Execute Tasks Sequentially

**CRITICAL: Tasks MUST be done in order!**

```
Backend (Days 1-10):
  00-setup → 01-parser → 02-reconstructor → 03-cleaner → 04-extractor (CRITICAL)
  → 05-chunker → 06-embeddings → 07-vectordb → 08-orchestrator
  → 09-db-setup → 10-rag → 11-api-chat → 12-api-other → 13-testing

Frontend (Days 11-14):
  F01-setup → F02-container → F03-list → F04-bubble → F05-input
  → F06-source → F07-integration → F08-styling → F09-testing

Deployment (Days 15-17):
  D01-backend → D02-frontend → D03-env → D04-monitoring
```

### Step 3: For Each Task

**Follow this process EXACTLY:**

#### A. Open Task File
```bash
# Example for Task 01
Open: tasks/backend/01-stage1-parser.md
```

#### B. Update Status
```markdown
**Status**: [~] IN_PROGRESS
**Started**: [Date/Time]
```

#### C. Check Dependencies
- Verify previous tasks are complete
- If not, STOP and complete dependencies first

#### D. Implement
1. **Read Goals** - Understand what to achieve
2. **Read Acceptance Criteria** - Know when you're done
3. **Follow Implementation** - Use provided code/steps
4. **Create files** in correct locations

#### E. Test Thoroughly
**RUN ALL TESTS** in Testing Checklist:
```markdown
- [ ] Unit test 1
- [ ] Unit test 2
- [ ] Integration test
- [ ] Manual verification
```

**DO NOT skip tests!** Quality over speed.

#### F. Verify Success Criteria
Only proceed if ALL items checked:
```markdown
✅ File created
✅ All tests pass
✅ Code runs without errors
✅ Output matches specification
```

#### G. Mark Complete
```markdown
**Status**: [x] DONE
**Completed**: [Date/Time]
**Notes**: [Any important observations]
```

#### H. Update Tracker
In `tasks/TASK_TRACKER.md`:
```markdown
| 01 | SRT Parser | ✅ DONE | 3h | 01/20 | 01/20 |
```

#### I. Commit Code
```bash
git add .
git commit -m "Complete Task 01: SRT Parser - All tests passing"
```

#### J. Next Task
Follow the "Next Task" link in completed task file.

---

## 🎯 Critical Tasks (Pay Extra Attention)

### Task 04: Knowledge Extractor ⭐⭐⭐
**This is the MOST IMPORTANT task!**

- Extracts semantic knowledge from text
- Creates structured knowledge objects
- Determines chatbot answer quality
- **Spend extra time here**
- **Test extensively with real transcript**

Expected output:
- 30-50 knowledge objects (not 288 text fragments!)
- Each with: topic, entities, quotes, metadata
- Example in KNOWLEDGE_PROCESSING_EXAMPLES.md

### Task 11: Chat API ⭐⭐
**Main user-facing endpoint**

- Implements RAG pipeline
- Must return accurate answers
- Response time < 3 seconds
- Test with 20+ real questions

### Task F02: Chat Container ⭐⭐
**Main UI component**

- Manages all conversation state
- Integrates with backend API
- User experience depends on this

---

## 💡 Implementation Tips

### When Reading Task Files

**Always check these sections:**
1. **Goals** - What are we achieving?
2. **Acceptance Criteria** - How do I know I'm done?
3. **Implementation** - Full code provided
4. **Testing Checklist** - MUST complete all
5. **Common Issues** - Solutions for problems

### When Writing Code

**Use the code in task files!** They contain:
- Complete, tested implementations
- Proper error handling
- Japanese UTF-8 support
- Best practices

**Don't reinvent the wheel.** Copy and adapt the provided code.

### When Testing

**Never skip tests.** Each task has:
- Unit tests
- Integration tests
- Manual verification steps

**All must pass** before marking task complete.

---

## 🔍 Quality Checklist

Before marking ANY task as DONE, verify:

- [ ] ✅ All Acceptance Criteria checked
- [ ] ✅ All tests in Testing Checklist passed
- [ ] ✅ Code runs without errors
- [ ] ✅ Japanese characters handled correctly (if applicable)
- [ ] ✅ Output matches expected format
- [ ] ✅ Performance acceptable (if specified)
- [ ] ✅ No warnings in console/logs
- [ ] ✅ Files created in correct locations
- [ ] ✅ Documentation updated (if needed)

---

## 🐛 Troubleshooting

### If a Task Fails

1. **Check Common Issues** section in task file
2. **Review PRD.md** for specifications
3. **Check dependencies** are complete
4. **Run tests individually** to isolate problem
5. **Document issue** in task file:
   ```markdown
   **Status**: ⚠️ BLOCKED
   **Issue**: [Description]
   ```

### If Tests Fail

1. **Read test output carefully**
2. **Check implementation matches task specification**
3. **Verify file paths are correct**
4. **Check environment variables set**
5. **Test with simpler input first**

### If Context Running Low

**STOP immediately and ask user:**
```
"Context is at [X]%. Should I compact the conversation before continuing
with Task [N]?"
```

---

## 📊 Progress Tracking

### Daily Updates

**End of each work session, update TASK_TRACKER.md:**

```markdown
## Progress - [Date]

### Completed Today
- ✅ Task 00: Backend Setup
- ✅ Task 01: SRT Parser

### In Progress
- 🟦 Task 02: Text Reconstructor (50% - tests pending)

### Blocked
- None

### Tomorrow
- [ ] Complete Task 02
- [ ] Start Task 03
```

### Milestone Checks

When reaching milestones, verify in TASK_TRACKER.md:
```markdown
- [x] **Milestone 1**: Backend pipeline working
  - Completed: [Date]
  - Notes: Pipeline processes transcript in 45 seconds
  - All 30+ knowledge objects extracted
```

---

## 🎓 Best Practices for Claude Code

### DO:
1. ✅ **Read entire task file** before starting
2. ✅ **Use provided code** in task files
3. ✅ **Run ALL tests** - no shortcuts
4. ✅ **Update TASK_TRACKER.md** after each task
5. ✅ **Check context remaining** frequently
6. ✅ **Ask user** if unsure about approach
7. ✅ **Test with real transcript.srt** data
8. ✅ **Verify Japanese characters** display correctly
9. ✅ **Commit code** after each completed task
10. ✅ **Document issues** encountered

### DON'T:
1. ❌ **Skip tasks** to go faster
2. ❌ **Skip tests** "to save time"
3. ❌ **Mark done** if tests fail
4. ❌ **Deviate** from specifications
5. ❌ **Ignore errors** or warnings
6. ❌ **Continue** if context is low (<30k)
7. ❌ **Assume** - check PRD.md if unclear
8. ❌ **Forget** to update TASK_TRACKER.md
9. ❌ **Rush** critical tasks (04, 11, F02)
10. ❌ **Leave task files** unupdated

---

## 📞 Communication with User

### When Starting a New Task
```
"Starting Task [N]: [Task Name]
Location: tasks/[section]/[file].md
Expected time: [X] hours
Dependencies: [List]

I'll update you when complete."
```

### When Completing a Task
```
"✅ Task [N] Complete: [Task Name]

Results:
- [Key achievement 1]
- [Key achievement 2]
- All tests passing ✓

Updated TASK_TRACKER.md

Next: Task [N+1]: [Name]"
```

### When Blocked
```
"⚠️ Task [N] Blocked: [Task Name]

Issue: [Description]
Tried: [Solutions attempted]
Need: [What would help]

Should I [suggested approach]?"
```

### When Context Low
```
"⚠️ Context Warning

Current: [X] tokens / 200,000
Remaining: [Y] tokens ([Z]%)

Should I compact the conversation before continuing?
I'm currently on Task [N]: [Name]"
```

---

## 🎯 Quick Reference

| Need | File | Section |
|------|------|---------|
| Project overview | `PRD.md` | Section 1 |
| Tech architecture | `PRD.md` | Section 2 |
| Content pipeline | `PRD.md` | Section 3.1 |
| API specs | `PRD.md` | Section 3.3 |
| All tasks list | `tasks/TASK_TRACKER.md` | Full file |
| Current task details | `tasks/[section]/[N]-[name].md` | Full file |
| How to work | `tasks/HOW_TO_USE_TASKS.md` | Full file |
| Real examples | `KNOWLEDGE_PROCESSING_EXAMPLES.md` | Examples 1-3 |
| Test questions | `PRD.md` | Section 3.5.1 |

---

## 🚀 Getting Started

### First Session Checklist

- [ ] Read this CLAUDE.md file completely
- [ ] Read PRD.md (focus on Section 3.1)
- [ ] Read KNOWLEDGE_PROCESSING_EXAMPLES.md
- [ ] Review TASK_TRACKER.md
- [ ] Check context remaining (>100k tokens recommended)
- [ ] Confirm with user ready to start
- [ ] Open `tasks/backend/00-setup.md`
- [ ] Begin execution!

---

## 📈 Success Metrics

### Task Completion
- **Time**: ~70 hours total (3 weeks part-time)
- **Quality**: All tests must pass
- **Coverage**: All 26 tasks completed

### Final Deliverables
- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] Can ask questions in Japanese
- [ ] Chatbot answers accurately (>85%)
- [ ] Provides source citations
- [ ] Response time < 3 seconds
- [ ] No production errors

---

## 🎉 Project Completion

When ALL tasks done:

1. **Run final tests**:
   - Backend health check ✓
   - Frontend loads ✓
   - Can send message ✓
   - Receives accurate answer ✓
   - Sources displayed ✓

2. **Verify production**:
   - Backend URL: https://[project].vercel.app
   - Frontend URL: https://[project].vercel.app
   - Both accessible ✓
   - No errors in logs ✓

3. **Update TASK_TRACKER.md**:
   ```markdown
   ## ✅ PROJECT COMPLETE

   Completion Date: [Date]
   Total Time: [Hours]
   All 26 tasks: ✅ DONE

   Production URLs:
   - Backend: [URL]
   - Frontend: [URL]
   ```

4. **Celebrate** 🎉

---

## 🔄 Context Compaction Strategy

If context gets low during work:

### What to Keep
- Current task file content
- PRD.md Section 3.1 (pipeline)
- TASK_TRACKER.md (progress)
- Recent conversation (last 5-10 messages)

### What to Compact
- Completed task details
- Old conversation history
- Example code from past tasks

### How to Compact
**Ask user:**
```
"Context at [X]%. I'll keep:
- Current task details
- Pipeline specification
- Progress tracker
- Recent conversation

Compact the rest. Proceed?"
```

---

## 💾 Save This Context

**Claude, remember these key facts:**

1. **Project Type**: Voice chatbot with intelligent knowledge extraction
2. **Critical Innovation**: 7-stage pipeline that creates semantic knowledge chunks
3. **Most Important Task**: Task 04 (Knowledge Extractor)
4. **Total Tasks**: 26 tasks across backend, frontend, deployment
5. **Quality Standard**: All tests must pass before task completion
6. **Context Warning**: Alert at <30k tokens remaining
7. **Execution Order**: Must follow task dependencies strictly
8. **Success = All 26 tasks done + deployed + working chatbot

---

## 📞 Ready to Start?

**Claude, when user says "start" or "begin":**

1. Check context remaining
2. If >100k tokens: Proceed
3. If <100k tokens: Ask to compact first
4. Confirm: "Ready to start Task 00: Backend Setup?"
5. Open `tasks/backend/00-setup.md`
6. Execute the task following the workflow above
7. Update user on progress
8. Move to next task when complete

**Let's build an amazing chatbot! 🚀**

---

**Version**: 1.0
**Created**: 2025-01-20
**For**: Claude Code Execution
