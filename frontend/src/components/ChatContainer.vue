<template>
  <div class="flex flex-col h-[650px] glass rounded-3xl overflow-hidden">
    <!-- Messages Area -->
    <div
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-6 space-y-4"
    >
      <!-- Welcome Message -->
      <div v-if="messages.length === 0" class="text-center mt-12">
        <p class="text-xl mb-3 font-semibold text-white">こんにちは！</p>
        <p class="text-sm text-white opacity-80">青木さんの教えについて質問してください。</p>
      </div>

      <!-- Messages -->
      <MessageBubble
        v-for="(message, index) in messages"
        :key="index"
        :message="message"
      />

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="flex items-start space-x-3">
        <div class="w-10 h-10 rounded-full glass-light flex items-center justify-center">
          <span class="text-xs font-semibold text-white">AI</span>
        </div>
        <div class="flex space-x-1 items-center pt-3">
          <div class="w-2.5 h-2.5 rounded-full animate-bounce bg-white" style="animation-delay: 0ms;"></div>
          <div class="w-2.5 h-2.5 rounded-full animate-bounce bg-white" style="animation-delay: 150ms;"></div>
          <div class="w-2.5 h-2.5 rounded-full animate-bounce bg-white" style="animation-delay: 300ms;"></div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="glass-light rounded-2xl p-4">
        <p class="text-red-300 text-sm font-medium">{{ error }}</p>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-5" style="background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.1));">
      <InputBox
        :disabled="isLoading"
        @send="handleSendMessage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch } from 'vue'
import { chatAPI } from '../services/api.js'
import { chatLogger } from '../services/logger.js'
import MessageBubble from './MessageBubble.vue'
import InputBox from './InputBox.vue'

// State
const messages = ref([])
const isLoading = ref(false)
const error = ref(null)
const conversationId = ref(null)
const messagesContainer = ref(null)
const currentLogId = ref(null)

// Load conversation from sessionStorage
onMounted(() => {
  const saved = sessionStorage.getItem('chatHistory')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      messages.value = data.messages || []
      conversationId.value = data.conversationId || null
      currentLogId.value = data.logId || null
    } catch (e) {
      console.error('Failed to load chat history:', e)
    }
  }

  // Create new log if none exists
  if (!currentLogId.value) {
    currentLogId.value = chatLogger.createNewLog()
  }
})

// Watch messages and save to log
watch(messages, (newMessages) => {
  if (newMessages.length > 0 && currentLogId.value) {
    chatLogger.saveLog(currentLogId.value, newMessages)
  }
}, { deep: true })

// Save conversation
function saveConversation() {
  sessionStorage.setItem('chatHistory', JSON.stringify({
    messages: messages.value,
    conversationId: conversationId.value,
    logId: currentLogId.value
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
    // Prepare conversation history for API
    const conversationHistory = messages.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    // Call API with conversation history
    const response = await chatAPI.sendMessage(
      userMessage,
      conversationId.value,
      conversationHistory
    )

    // Update conversationId
    if (response.conversationId) {
      conversationId.value = response.conversationId
    }

    // Add AI response (without sources in UI)
    messages.value.push({
      role: 'assistant',
      content: response.response,
      sources: response.sources || [], // Keep in data for logging
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
  // Save final state before clearing
  if (currentLogId.value && messages.value.length > 0) {
    chatLogger.saveLog(currentLogId.value, messages.value, true)
  }

  // Create new log for new conversation
  currentLogId.value = chatLogger.createNewLog()

  // Clear state
  messages.value = []
  conversationId.value = null
  error.value = null
  sessionStorage.removeItem('chatHistory')

  // Save new log ID
  saveConversation()
}

// Start new session (same as clear but more semantic)
function startNewSession() {
  clearConversation()
}

// Load a specific session
function loadSession(sessionId) {
  try {
    // Save current session if has messages
    if (currentLogId.value && messages.value.length > 0) {
      chatLogger.saveLog(currentLogId.value, messages.value, true)
    }

    // Load the session
    const session = chatLogger.loadSession(sessionId)
    if (!session) {
      error.value = 'セッションを読み込めませんでした'
      return
    }

    // Update state
    messages.value = session.messages || []
    conversationId.value = session.conversationId || null
    currentLogId.value = session.id
    error.value = null

    // Update session status to active
    chatLogger.saveLog(currentLogId.value, messages.value, false)

    // Save to sessionStorage
    saveConversation()

    // Scroll to bottom
    nextTick(() => scrollToBottom())

    console.log(`[ChatContainer] Loaded session: ${sessionId}`)
  } catch (err) {
    console.error('[ChatContainer] Error loading session:', err)
    error.value = 'セッションの読み込み中にエラーが発生しました'
  }
}

// Expose for parent component
defineExpose({
  clearConversation,
  startNewSession,
  loadSession
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
