<template>
  <div :class="messageClasses">
    <!-- Avatar -->
    <div :class="avatarClasses">
      <span class="text-xs font-medium">{{ message.role === 'user' ? 'You' : 'AI' }}</span>
    </div>

    <!-- Message Content -->
    <div :class="bubbleClasses">
      <p class="whitespace-pre-wrap">{{ message.content }}</p>

      <!-- Sources (for AI messages) -->
      <div v-if="message.sources && message.sources.length > 0" class="mt-3 pt-3 border-t border-gray-200">
        <p class="text-xs font-semibold text-gray-600 mb-2">📎 Sources:</p>
        <div class="space-y-2">
          <div
            v-for="(source, index) in message.sources"
            :key="index"
            class="text-xs text-gray-500 bg-gray-50 p-2 rounded"
          >
            <p v-if="source.timestamp">
              <strong>Timestamp:</strong> {{ source.timestamp }}
            </p>
            <p v-if="source.topic">
              <strong>Topic:</strong> {{ source.topic }}
            </p>
            <p v-if="source.text" class="mt-1 text-gray-600">
              {{ truncateText(source.text, 150) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Timestamp -->
      <p class="text-xs text-gray-400 mt-2">
        {{ formatTime(message.timestamp) }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true,
    validator: (value) => {
      return ['user', 'assistant'].includes(value.role) && value.content
    }
  }
})

// Computed classes for layout
const messageClasses = computed(() => {
  const base = 'flex items-start space-x-2'
  return props.message.role === 'user'
    ? `${base} flex-row-reverse space-x-reverse`
    : base
})

const avatarClasses = computed(() => {
  const base = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0'
  return props.message.role === 'user'
    ? `${base} bg-blue-500 text-white`
    : `${base} bg-gray-300 text-gray-700`
})

const bubbleClasses = computed(() => {
  const base = 'max-w-[70%] rounded-lg px-4 py-2 break-words'
  return props.message.role === 'user'
    ? `${base} bg-blue-500 text-white`
    : `${base} bg-gray-100 text-gray-900`
})

// Format timestamp
function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Truncate text
function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>
