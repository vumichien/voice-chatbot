# Task F02: Chat Container Component

**Status**: [ ] TODO
**Estimated Time**: 3 hours
**Dependencies**: Task F01 (Frontend Setup)
**Priority**: HIGH
**File**: `src/components/ChatContainer.vue`

---

## 📋 Description

Create the main ChatContainer component that manages conversation state, handles user input/output, and orchestrates the chat interface.

---

## 🎯 Goals

1. Create chat state management (messages, loading, errors)
2. Integrate with API service layer
3. Handle message sending and receiving
4. Display conversation history
5. Show loading indicators
6. Handle errors gracefully

---

## ✅ Acceptance Criteria

- [ ] Maintains conversation history in state
- [ ] Sends messages to API and receives responses
- [ ] Shows loading state while waiting for response
- [ ] Displays both user and AI messages
- [ ] Handles API errors with user-friendly messages
- [ ] Auto-scrolls to latest message
- [ ] Preserves conversationId across messages

---

## 🔧 Implementation

### src/components/ChatContainer.vue

```vue
<template>
  <div class="flex flex-col h-[600px] bg-white rounded-lg shadow-lg">
    <!-- Messages Area -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4"
    >
      <!-- Welcome Message -->
      <div v-if="messages.length === 0" class="text-center text-gray-500 mt-8">
        <p class="text-lg mb-2">こんにちは！</p>
        <p class="text-sm">青木さんの教えについて質問してください。</p>
      </div>

      <!-- Messages -->
      <MessageBubble
        v-for="(message, index) in messages"
        :key="index"
        :message="message"
      />

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="flex items-start space-x-2">
        <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
          <span class="text-xs">AI</span>
        </div>
        <div class="flex space-x-1 items-center">
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
          <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800 text-sm">{{ error }}</p>
      </div>
    </div>

    <!-- Input Area -->
    <div class="border-t p-4">
      <InputBox
        :disabled="isLoading"
        @send="handleSendMessage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { chatAPI } from '../services/api.js'
import MessageBubble from './MessageBubble.vue'
import InputBox from './InputBox.vue'

// State
const messages = ref([])
const isLoading = ref(false)
const error = ref(null)
const conversationId = ref(null)
const messagesContainer = ref(null)

// Load conversation from sessionStorage
onMounted(() => {
  const saved = sessionStorage.getItem('chatHistory')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      messages.value = data.messages || []
      conversationId.value = data.conversationId || null
    } catch (e) {
      console.error('Failed to load chat history:', e)
    }
  }
})

// Save conversation
function saveConversation() {
  sessionStorage.setItem('chatHistory', JSON.stringify({
    messages: messages.value,
    conversationId: conversationId.value
  }))
}

// Handle sending message
async function handleSendMessage(userMessage) {
  if (!userMessage.trim()) return

  // Clear error
  error.value = null

  // Add user message
  messages.value.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date()
  })

  // Save and scroll
  saveConversation()
  scrollToBottom()

  // Set loading
  isLoading.value = true

  try {
    // Call API
    const response = await chatAPI.sendMessage(userMessage, conversationId.value)

    // Update conversationId
    if (response.conversationId) {
      conversationId.value = response.conversationId
    }

    // Add AI response
    messages.value.push({
      role: 'assistant',
      content: response.response,
      sources: response.sources || [],
      timestamp: new Date()
    })

    // Save and scroll
    saveConversation()
    await nextTick()
    scrollToBottom()

  } catch (err) {
    console.error('Chat error:', err)
    error.value = 'エラーが発生しました。もう一度お試しください。'

  } finally {
    isLoading.value = false
  }
}

// Scroll to bottom
function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Clear conversation
function clearConversation() {
  messages.value = []
  conversationId.value = null
  error.value = null
  sessionStorage.removeItem('chatHistory')
}

// Expose for parent component
defineExpose({
  clearConversation
})
</script>

<style scoped>
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-bounce {
  animation: bounce 1s infinite;
}
</style>
```

---

## 🧪 Testing Checklist

### Component Tests

- [ ] **Renders empty state**:
  - Shows welcome message when no messages
  - No errors on initial load

- [ ] **Message sending**:
  - User can type and send message
  - User message appears immediately
  - Loading indicator shows while waiting

- [ ] **Message receiving**:
  - AI response appears after API call
  - Sources displayed (if present)
  - No duplicate messages

- [ ] **Error handling**:
  - API error shows error message
  - Can retry after error
  - Error message dismisses on next send

- [ ] **State persistence**:
  - Messages persist on page refresh
  - ConversationId maintained across messages

### Integration Tests

- [ ] **Test with real API**:
  1. Start backend API
  2. Send message: "青木さんについて教えてください"
  3. Verify response appears
  4. Check sources are displayed
  5. Send follow-up question
  6. Verify conversationId maintained

### Manual Testing

Test these scenarios:

1. **Normal flow**:
   - Send question
   - Wait for response
   - Response appears with sources
   - Can send another question

2. **Error scenarios**:
   - Backend API down → Error message
   - Network timeout → Error message
   - Invalid response → Error message

3. **Edge cases**:
   - Empty message → Nothing happens
   - Very long message → Handled gracefully
   - Rapid multiple messages → Queue properly

4. **Persistence**:
   - Send messages
   - Refresh page
   - Messages still visible

---

## 📊 Expected Behavior

### Normal Conversation
```
User: 青木さんが29歳の時に出会ったものは何ですか？

[Loading indicator appears...]

AI: 青木さんは29歳でバイブル（聖書）と出会いました。
    そこで黄金率という教えを知り、人生が変わりました。

📎 Sources:
   - Timestamp: 00:01:19,320 --> 00:01:44,880
   - Topic: 黄金率と価値観
```

### Error Handling
```
User: Test question

[API fails]

❌ Error: エラーが発生しました。もう一度お試しください。
```

---

## ⚠️ Common Issues

### Issue: Messages don't scroll to bottom
- **Solution**: Use `nextTick()` before scrolling

### Issue: Duplicate messages
- **Solution**: Check message array not mutated incorrectly

### Issue: ConversationId not persisted
- **Solution**: Verify sessionStorage save/load

---

## ✨ Success Criteria

Task is complete when:
1. ✅ Component renders correctly
2. ✅ Can send and receive messages
3. ✅ Loading states work
4. ✅ Errors handled gracefully
5. ✅ Messages persist on refresh
6. ✅ Auto-scrolls to latest message
7. ✅ Integration with API works

---

## 📌 Next Task

**Task F03: Message Bubble Component** (`tasks/frontend/03-message-bubble.md`)

---

**Status**: [ ] TODO
**Started**: _____
**Completed**: _____
