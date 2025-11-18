<template>
  <div :class="messageClasses">
    <!-- Avatar -->
    <div :class="avatarClasses">
      <img
        v-if="message.role === 'assistant'"
        src="/avatar/aoki-1.png"
        alt="Aoki"
        class="w-full h-full object-cover rounded-full"
      />
      <span v-else class="text-lg">👤</span>
    </div>

    <!-- Message Content -->
    <div :class="bubbleClasses">
      <div 
        v-if="message.role === 'assistant'" 
        class="markdown-content leading-relaxed text-white" 
        v-html="renderedMarkdown"
      ></div>
      <p v-else class="whitespace-pre-wrap leading-relaxed text-white">{{ message.content }}</p>

      <!-- Timestamp and Audio Controls -->
      <div class="flex items-center justify-between mt-2">
        <p class="text-xs opacity-60 text-white">
          {{ formatTime(message.timestamp) }}
        </p>

        <!-- Audio Controls (only for assistant messages with audio) -->
        <div v-if="message.role === 'assistant' && message.audio" class="flex items-center space-x-2">
          <!-- Play/Pause/Resume Button -->
          <button
            @click="handleAudioClick"
            class="text-white opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
            :title="audioButtonTitle"
          >
            <span v-if="audioState.playing" class="text-lg animate-pulse">🔊</span>
            <span v-else-if="audioState.paused" class="text-lg">⏸️</span>
            <span v-else class="text-lg">🔈</span>
          </button>

          <!-- Replay Button (when audio has ended or stopped) -->
          <button
            v-if="audioState.stopped && hasPlayedOnce"
            @click="handleReplayClick"
            class="text-white opacity-70 hover:opacity-100 transition-opacity focus:outline-none"
            title="Replay"
          >
            <span class="text-lg">🔄</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { marked } from 'marked'

const props = defineProps({
  message: {
    type: Object,
    required: true,
    validator: (value) => {
      return ['user', 'assistant'].includes(value.role) && value.content
    }
  },
  audioState: {
    type: Object,
    default: () => ({ playing: false, paused: false, stopped: true })
  }
})

const emit = defineEmits(['play-audio', 'pause-audio', 'resume-audio', 'replay-audio'])

const hasPlayedOnce = ref(false)

// Configure marked for inline rendering
marked.setOptions({
  breaks: true,
  gfm: true
})

// Render markdown for assistant messages
const renderedMarkdown = computed(() => {
  if (props.message.role === 'assistant') {
    return marked.parse(props.message.content)
  }
  return ''
})

// Computed classes for layout
const messageClasses = computed(() => {
  const base = 'flex items-start space-x-3'
  return props.message.role === 'user'
    ? `${base} flex-row-reverse space-x-reverse`
    : base
})

const avatarClasses = computed(() => {
  return 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 glass-light overflow-hidden'
})

const bubbleClasses = computed(() => {
  const base = 'max-w-[70%] rounded-2xl px-5 py-3 break-words'
  if (props.message.role === 'user') {
    return `${base} glass-strong`
  } else {
    return `${base} glass-light`
  }
})

// Audio button title
const audioButtonTitle = computed(() => {
  if (props.audioState.playing) return 'Pause'
  if (props.audioState.paused) return 'Resume'
  return 'Play'
})

// Handle audio control click
function handleAudioClick() {
  if (props.audioState.playing) {
    emit('pause-audio', props.message)
  } else if (props.audioState.paused) {
    emit('resume-audio', props.message)
  } else {
    hasPlayedOnce.value = true
    emit('play-audio', props.message)
  }
}

// Handle replay click
function handleReplayClick() {
  emit('replay-audio', props.message)
}

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

<style scoped>
/* Markdown content styling */
.markdown-content :deep(strong) {
  font-weight: 700;
  color: #ffffff;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(p) {
  margin: 0;
  white-space: pre-wrap;
}

.markdown-content :deep(p + p) {
  margin-top: 0.75rem;
}

.markdown-content :deep(ul), 
.markdown-content :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin: 0.25rem 0;
}

.markdown-content :deep(code) {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.9em;
}

.markdown-content :deep(blockquote) {
  border-left: 3px solid rgba(255, 255, 255, 0.3);
  padding-left: 1rem;
  margin: 0.5rem 0;
  opacity: 0.9;
}
</style>
