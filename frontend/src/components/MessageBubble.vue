<template>
  <div :class="messageClasses">
    <!-- Avatar -->
    <div :class="avatarClasses">
      <span class="text-lg">{{ message.role === 'user' ? '👤' : '🤖' }}</span>
    </div>

    <!-- Message Content -->
    <div :class="bubbleClasses">
      <p class="whitespace-pre-wrap leading-relaxed text-white">{{ message.content }}</p>

      <!-- Timestamp -->
      <p class="text-xs mt-2 opacity-60 text-white">
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
  const base = 'flex items-start space-x-3'
  return props.message.role === 'user'
    ? `${base} flex-row-reverse space-x-reverse`
    : base
})

const avatarClasses = computed(() => {
  return 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 glass-light'
})

const bubbleClasses = computed(() => {
  const base = 'max-w-[70%] rounded-2xl px-5 py-3 break-words'
  if (props.message.role === 'user') {
    return `${base} glass-strong`
  } else {
    return `${base} glass-light`
  }
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
</script>
