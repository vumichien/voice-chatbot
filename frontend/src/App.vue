<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto py-4 px-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">
          AI Knowledge Chatbot
        </h1>
        <button
          @click="handleClearChat"
          class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Clear Chat
        </button>
      </div>
    </header>

    <main class="max-w-4xl mx-auto p-4">
      <ChatContainer ref="chatRef" />
    </main>

    <footer class="text-center text-gray-500 text-sm py-4">
      <p>青木さんの教えについて質問できます</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChatContainer from './components/ChatContainer.vue'

const chatRef = ref(null)

function handleClearChat() {
  if (confirm('チャット履歴を削除しますか？')) {
    chatRef.value?.clearConversation()
  }
}
</script>
