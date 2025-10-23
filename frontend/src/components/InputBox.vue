<template>
  <div class="flex items-end space-x-2">
    <!-- Text Input -->
    <div class="flex-1">
      <textarea
        ref="inputRef"
        v-model="inputText"
        :disabled="disabled"
        :placeholder="placeholder"
        rows="1"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        @keydown.enter.exact.prevent="handleSend"
        @input="autoResize"
      />
    </div>

    <!-- Send Button -->
    <button
      :disabled="disabled || !inputText.trim()"
      class="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      @click="handleSend"
    >
      Send
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
