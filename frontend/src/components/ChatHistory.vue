<template>
  <div class="h-full flex flex-col glass">
    <!-- Header -->
    <div class="p-5 border-b" style="border-color: rgba(255, 255, 255, 0.2);">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-white">チャット履歴</h2>
        <button
          @click="$emit('close')"
          class="glass-button p-2 rounded-lg text-white"
          title="閉じる"
        >
          <span class="text-lg">✕</span>
        </button>
      </div>

      <!-- New Chat Button -->
      <button
        @click="handleNewChat"
        class="w-full glass-button px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 text-white"
      >
        <span class="text-xl">+</span>
        <span>新しいチャット</span>
      </button>
    </div>

    <!-- Sessions List -->
    <div class="flex-1 overflow-y-auto p-4 space-y-3">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <p class="text-white opacity-80">読み込み中...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="sessions.length === 0" class="text-center py-8">
        <p class="text-sm text-white opacity-70">まだチャット履歴がありません</p>
      </div>

      <!-- Session Items -->
      <div
        v-for="session in sessions"
        :key="session.id"
        :class="[
          'glass-light rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]',
          currentSessionId === session.id ? 'ring-2 ring-white ring-opacity-50' : ''
        ]"
        @click="handleLoadSession(session.id)"
      >
        <!-- Session Title -->
        <h3 class="font-semibold mb-1 truncate text-white">
          {{ session.title }}
        </h3>

        <!-- Session Preview -->
        <p class="text-xs mb-2 opacity-70 truncate text-white">
          {{ session.preview || '...' }}
        </p>

        <!-- Session Metadata -->
        <div class="flex items-center justify-between text-xs text-white">
          <span>{{ formatDate(session.updatedAt) }}</span>
          <div class="flex items-center space-x-2">
            <span>{{ session.messageCount }} メッセージ</span>
            <button
              @click.stop="handleDeleteSession(session.id)"
              class="glass-button-sm p-1.5 rounded-lg"
              title="削除"
            >
              <span class="text-red-300">🗑</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Stats -->
    <div class="p-4 border-t text-center text-xs text-white opacity-80" style="border-color: rgba(255, 255, 255, 0.2);">
      <p>合計 {{ sessions.length }} セッション</p>
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      v-model:show="showDeleteConfirm"
      title="セッションを削除"
      message="このセッションを削除してもよろしいですか？この操作は取り消せません。"
      confirm-text="削除"
      cancel-text="キャンセル"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { chatLogger } from '../services/logger.js'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps({
  currentSessionId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['newChat', 'loadSession', 'close'])

// State
const sessions = ref([])
const loading = ref(false)
const showDeleteConfirm = ref(false)
const sessionToDelete = ref(null)

// Load sessions on mount
onMounted(() => {
  loadSessions()
})

// Load all sessions
function loadSessions() {
  loading.value = true
  try {
    sessions.value = chatLogger.listSessions()
  } catch (error) {
    console.error('[ChatHistory] Error loading sessions:', error)
  } finally {
    loading.value = false
  }
}

// Handle new chat
function handleNewChat() {
  emit('newChat')
}

// Handle load session
function handleLoadSession(sessionId) {
  emit('loadSession', sessionId)
}

// Handle delete session
function handleDeleteSession(sessionId) {
  sessionToDelete.value = sessionId
  showDeleteConfirm.value = true
}

// Confirm delete
function confirmDelete() {
  if (sessionToDelete.value) {
    chatLogger.deleteLog(sessionToDelete.value)
    loadSessions() // Reload list
    sessionToDelete.value = null

    // If deleted session was current, emit newChat
    if (sessionToDelete.value === props.currentSessionId) {
      emit('newChat')
    }
  }
}

// Format date
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'たった今'
  if (diffMins < 60) return `${diffMins}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  if (diffDays < 7) return `${diffDays}日前`

  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric'
  })
}

// Expose refresh method for parent
defineExpose({
  loadSessions
})
</script>

<style scoped>
.glass-button-sm {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.2s;
}

.glass-button-sm:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.glass-button-sm:active {
  transform: scale(0.95);
}
</style>
