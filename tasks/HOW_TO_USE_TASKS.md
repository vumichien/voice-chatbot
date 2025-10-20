# How to Use the Task System

This guide explains how to use the task management system for the Voice Chatbot project.

---

## 📁 Folder Structure

```
tasks/
├── README.md                    # Task overview
├── TASK_TRACKER.md             # Master progress tracker
├── HOW_TO_USE_TASKS.md         # This file
├── backend/                     # Backend tasks
│   ├── 00-setup.md
│   ├── 01-stage1-parser.md
│   ├── 02-stage2-reconstructor.md
│   ├── 04-stage4-extractor.md
│   ├── 11-api-chat.md
│   └── ... (more task files)
├── frontend/                    # Frontend tasks
│   ├── 01-setup.md
│   ├── 02-chat-container.md
│   └── ... (more task files)
└── deployment/                  # Deployment tasks
    ├── 01-backend-deploy.md
    └── ... (more task files)
```

---

## 🎯 Task File Structure

Each task file contains:

### 1. **Header** - Status and metadata
```markdown
**Status**: [ ] TODO | [~] IN_PROGRESS | [x] DONE
**Estimated Time**: 3 hours
**Dependencies**: Previous tasks required
**Priority**: HIGH | MEDIUM | LOW
**File**: lib/parser.js
```

### 2. **Description** - What this task is about

### 3. **Goals** - Specific objectives to achieve

### 4. **Acceptance Criteria** - Checklist of requirements
```markdown
- [ ] Requirement 1
- [ ] Requirement 2
```

### 5. **Implementation** - Code examples and steps

### 6. **Testing Checklist** - How to verify quality
```markdown
- [ ] Unit test X passes
- [ ] Integration test Y works
- [ ] Manual test Z verified
```

### 7. **Success Criteria** - When task is complete

### 8. **Next Task** - Link to next task

---

## 🚀 How to Start Working

### Step 1: Open TASK_TRACKER.md
This is your master file showing all tasks and progress.

### Step 2: Pick a Task
Start with `backend/00-setup.md` (always start here!)

### Step 3: Update Status
Open the task file and change:
```markdown
**Status**: [~] IN_PROGRESS
**Started**: 2025-01-20
```

### Step 4: Follow Implementation Steps
Read and implement each step in the task file.

### Step 5: Run Tests
Complete ALL items in the Testing Checklist:
```markdown
- [x] Test 1 passed
- [x] Test 2 passed
- [x] Test 3 passed
```

### Step 6: Mark as Done
When all tests pass and Success Criteria met:
```markdown
**Status**: [x] DONE
**Completed**: 2025-01-20
**Notes**: All tests passing, ready for next task
```

### Step 7: Update Tracker
Go to `TASK_TRACKER.md` and mark task as complete:
```markdown
| 01 | Stage 1: SRT Parser | `01-stage1-parser.md` | ✅ DONE | ...
```

### Step 8: Move to Next Task
Follow the "Next Task" link in the completed task file.

---

## 📊 Tracking Progress

### Daily Workflow

**Morning**:
1. Open `TASK_TRACKER.md`
2. Review yesterday's progress
3. Plan today's tasks
4. Update status to IN_PROGRESS

**During Work**:
1. Open task file
2. Follow implementation steps
3. Check off completed items
4. Add notes for issues/learnings

**End of Day**:
1. Update `TASK_TRACKER.md`
2. Mark completed tasks
3. Note any blockers
4. Plan tomorrow

---

## ✅ How to Mark Tasks Complete

### In Task File
```markdown
**Status**: [x] DONE
**Started**: 2025-01-20 09:00
**Completed**: 2025-01-20 14:30
**Notes**:
- All tests passing
- Code reviewed
- Ready for integration
```

### In TASK_TRACKER.md
```markdown
| 01 | Stage 1: SRT Parser | `01-stage1-parser.md` | ✅ DONE | 🔴 HIGH | 3h | 01/20 | 01/20 |
```

Update progress bar:
```markdown
| Backend Pipeline | 7 | 1 | ⬛⬜⬜⬜⬜⬜⬜⬜⬜⬜ 14% |
```

---

## 🧪 Quality Assurance

**NEVER mark a task as DONE unless:**

1. ✅ All Acceptance Criteria checked
2. ✅ All Tests in Testing Checklist passed
3. ✅ Code runs without errors
4. ✅ Implementation matches specifications
5. ✅ Documentation updated (if needed)

---

## 📝 Example Workflow

### Starting Task 01 (SRT Parser)

1. **Open file**: `tasks/backend/01-stage1-parser.md`

2. **Update status**:
   ```markdown
   **Status**: [~] IN_PROGRESS
   **Started**: 2025-01-20 09:00
   ```

3. **Create file**: `lib/parser.js` (follow implementation)

4. **Write code**: Implement all functions shown

5. **Write tests**: Create `tests/unit/parser.test.js`

6. **Run tests**:
   ```bash
   npm test
   ```

7. **Check results**:
   ```markdown
   - [x] parseTimestamp test passed
   - [x] parseSRT test passed
   - [x] UTF-8 handling test passed
   - [x] Can parse transcript.srt
   - [x] Returns ~288 segments
   ```

8. **Mark complete**:
   ```markdown
   **Status**: [x] DONE
   **Completed**: 2025-01-20 12:00
   **Notes**: All tests passing, parsed 288 segments from transcript.srt
   ```

9. **Update tracker**:
   ```markdown
   | 01 | Stage 1: SRT Parser | ✅ DONE | 01/20 | 01/20 |
   ```

10. **Move to next**: Open `02-stage2-reconstructor.md`

---

## 🎓 Best Practices

### DO:
- ✅ Read entire task file before starting
- ✅ Check dependencies are complete
- ✅ Follow implementation steps exactly
- ✅ Run ALL tests in Testing Checklist
- ✅ Add notes about issues/solutions
- ✅ Update tracker regularly
- ✅ Commit code after each task

### DON'T:
- ❌ Skip tests to "finish faster"
- ❌ Mark task done if tests fail
- ❌ Skip dependencies
- ❌ Deviate from specifications
- ❌ Leave task files unupdated
- ❌ Forget to update tracker

---

## 🚨 Handling Blockers

If you get stuck:

1. **Document it** in task file:
   ```markdown
   **Status**: ⚠️ BLOCKED
   **Issue**: Kuromoji installation fails on Windows
   ```

2. **Update tracker**:
   ```markdown
   | 02 | Text Reconstructor | ⚠️ BLOCKED | ...
   ```

3. **Note in tracker**:
   ```markdown
   ### Blockers
   - Task 02: Kuromoji install issue on Windows
     - Trying alternative: budoux only
   ```

4. **Try solutions** in task's "Common Issues" section

5. **Document solution** for future reference

6. **Resume** when unblocked

---

## 📈 Tracking Overall Progress

### Weekly Review

Every Friday, review `TASK_TRACKER.md`:

1. Count completed tasks
2. Update progress percentages
3. Check if on track for milestones
4. Adjust timeline if needed
5. Note learnings

### Milestone Checks

When reaching a milestone:
```markdown
- [x] **Milestone 1**: Backend pipeline working
  - Completed: 2025-01-27
  - Notes: Pipeline processes transcript in 45 seconds
```

---

## 🎉 When All Tasks Complete

Final checklist in `TASK_TRACKER.md`:

```markdown
## ✅ Completion Checklist

- [x] All 26 tasks marked as DONE
- [x] All tests passing
- [x] Backend deployed
- [x] Frontend deployed
- [x] Can chat and get answers
- [x] Performance <3s
- [x] No production errors
```

---

## 💡 Tips for Success

1. **One task at a time** - Don't jump around
2. **Test thoroughly** - Quality over speed
3. **Document issues** - Help future you
4. **Update frequently** - Keep tracker current
5. **Take breaks** - Don't burn out
6. **Celebrate wins** - Mark milestones!

---

## 📞 Quick Reference

| Need | Location |
|------|----------|
| See all tasks | `TASK_TRACKER.md` |
| Current task details | `tasks/[section]/[number]-[name].md` |
| Implementation code | Each task file has full code |
| Testing steps | Each task's "Testing Checklist" |
| Common issues | Each task's "Common Issues" section |
| Next steps | Each task's "Next Task" section |

---

## 🚀 Ready to Start?

1. Open `tasks/backend/00-setup.md`
2. Update status to IN_PROGRESS
3. Follow the steps
4. Run all tests
5. Mark as DONE
6. Move to next task!

**Good luck! 🎯**
