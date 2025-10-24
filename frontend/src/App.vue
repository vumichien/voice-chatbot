<template>
  <div class="min-h-screen flex">
    <!-- Sidebar (History) -->
    <transition name="slide">
      <div
        v-if="showHistory"
        class="w-80 border-r flex-shrink-0"
        style="border-color: rgba(255, 255, 255, 0.2);"
      >
        <ChatHistory
          ref="historyRef"
          :current-session-id="currentSessionId"
          @new-chat="handleNewChat"
          @load-session="handleLoadSession"
          @close="showHistory = false"
        />
      </div>
    </transition>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <header class="py-6">
        <div class="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button
              @click="showHistory = !showHistory"
              class="glass-button px-4 py-2.5 rounded-xl font-medium text-white"
              title="履歴を表示"
            >
              <span class="text-xl">☰</span>
            </button>
            <h1 class="text-3xl font-bold tracking-tight text-white drop-shadow-lg">
              AIナレッジチャットボット
            </h1>
          </div>
          <button
            @click="showClearConfirm = true"
            class="glass-button px-6 py-2.5 rounded-xl font-medium text-white"
          >
            新しいチャット
          </button>
        </div>
      </header>

      <main class="flex-1 max-w-4xl w-full mx-auto px-6 pb-8">
        <ChatContainer
          ref="chatRef"
          @session-updated="handleSessionUpdated"
        />
      </main>

      <footer class="text-center py-6">
        <p class="text-sm text-white opacity-80">
          青木さんの教えについて質問できます
        </p>
      </footer>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmModal
      v-model:show="showClearConfirm"
      title="新しいチャットを開始"
      message="現在のチャットを保存して新しいチャットを開始しますか？"
      confirm-text="開始"
      cancel-text="キャンセル"
      @confirm="handleNewChatConfirmed"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChatContainer from './components/ChatContainer.vue'
import ChatHistory from './components/ChatHistory.vue'
import ConfirmModal from './components/ConfirmModal.vue'

const chatRef = ref(null)
const historyRef = ref(null)
const showHistory = ref(false)
const showClearConfirm = ref(false)
const currentSessionId = ref(null)

function handleNewChat() {
  chatRef.value?.startNewSession()
  currentSessionId.value = null
  historyRef.value?.loadSessions()
  showHistory.value = false
}

function handleNewChatConfirmed() {
  handleNewChat()
}

function handleLoadSession(sessionId) {
  chatRef.value?.loadSession(sessionId)
  currentSessionId.value = sessionId
  showHistory.value = false
}

function handleSessionUpdated(sessionId) {
  currentSessionId.value = sessionId
  historyRef.value?.loadSessions()
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
