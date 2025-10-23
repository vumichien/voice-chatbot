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
