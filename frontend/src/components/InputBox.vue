<template>
  <div class="flex items-start space-x-3">
    <!-- Text Input -->
    <div class="flex-1">
      <textarea
        ref="inputRef"
        v-model="inputText"
        :disabled="disabled"
        :placeholder="placeholder"
        rows="1"
        class="w-full px-5 py-3.5 glass-input rounded-2xl resize-none focus:outline-none disabled:cursor-not-allowed text-white placeholder-white placeholder-opacity-50"
        style="line-height: 1.5; min-height: 52px;"
        @keydown.enter.exact.prevent="handleSend"
        @input="autoResize"
      />
    </div>

    <!-- Send Button -->
    <button
      :disabled="disabled || !inputText.trim()"
      class="glass-button px-7 py-3.5 rounded-2xl font-semibold flex-shrink-0 text-white"
      style="min-height: 52px; margin-top: 0;"
      @click="handleSend"
    >
      送信
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  placeholder: {
    type: String,
    default: '質問を入力してください...'
  }
})

const emit = defineEmits(['send'])

const inputText = ref('')
const inputRef = ref(null)

// Handle send
function handleSend() {
  if (!inputText.value.trim() || props.disabled) return

  emit('send', inputText.value.trim())
  inputText.value = ''

  // Reset textarea height
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }
}

// Auto-resize textarea
function autoResize() {
  if (!inputRef.value) return

  inputRef.value.style.height = 'auto'
  const scrollHeight = inputRef.value.scrollHeight
  const maxHeight = 150 // Max height in pixels

  if (scrollHeight > maxHeight) {
    inputRef.value.style.height = maxHeight + 'px'
    inputRef.value.style.overflowY = 'auto'
  } else {
    inputRef.value.style.height = scrollHeight + 'px'
    inputRef.value.style.overflowY = 'hidden'
  }
}

// Focus input on mount
onMounted(() => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
})
</script>
