/**
 * Audio Player Composable
 * 
 * Manages audio playback for TTS responses
 * Provides play/pause/resume/replay functionality
 */

import { ref, onUnmounted } from 'vue'

export function useAudioPlayer() {
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const audioElement = ref(null)
  const currentAudioUrl = ref(null)
  const currentMessageId = ref(null)

  /**
   * Convert base64 audio to blob URL
   * @param {string} base64Audio - Base64 encoded audio
   * @returns {string} Blob URL
   */
  function base64ToBlob(base64Audio) {
    // Remove data URL prefix if present
    const base64Data = base64Audio.replace(/^data:audio\/\w+;base64,/, '')
    
    // Convert base64 to binary
    const binaryString = window.atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    
    // Create blob
    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    return URL.createObjectURL(blob)
  }

  /**
   * Play audio from base64 string
   * @param {string} base64Audio - Base64 encoded audio
   * @param {string} messageId - Unique message identifier
   * @param {boolean} autoPlay - Whether to auto-play
   */
  async function playAudio(base64Audio, messageId, autoPlay = true) {
    try {
      // If same audio is already loaded and paused, just resume
      if (currentMessageId.value === messageId && isPaused.value) {
        resumeAudio()
        return
      }

      // Stop any currently playing audio
      stopAudio()

      // Create new audio element
      const blobUrl = base64ToBlob(base64Audio)
      currentAudioUrl.value = blobUrl
      currentMessageId.value = messageId

      audioElement.value = new Audio(blobUrl)

      // Set up event listeners
      audioElement.value.addEventListener('ended', handleAudioEnded)
      audioElement.value.addEventListener('error', handleAudioError)

      if (autoPlay) {
        // Play the audio
        await audioElement.value.play()
        isPlaying.value = true
        isPaused.value = false
        console.log('[AudioPlayer] Playing audio for message:', messageId)
      }
    } catch (error) {
      console.error('[AudioPlayer] Error playing audio:', error)
      handleAudioError(error)
    }
  }

  /**
   * Pause current audio
   */
  function pauseAudio() {
    if (audioElement.value && isPlaying.value) {
      audioElement.value.pause()
      isPlaying.value = false
      isPaused.value = true
      console.log('[AudioPlayer] Audio paused')
    }
  }

  /**
   * Resume paused audio
   */
  async function resumeAudio() {
    if (audioElement.value && isPaused.value) {
      try {
        await audioElement.value.play()
        isPlaying.value = true
        isPaused.value = false
        console.log('[AudioPlayer] Audio resumed')
      } catch (error) {
        console.error('[AudioPlayer] Error resuming audio:', error)
        handleAudioError(error)
      }
    }
  }

  /**
   * Replay audio from beginning
   */
  async function replayAudio() {
    if (audioElement.value) {
      try {
        audioElement.value.currentTime = 0
        await audioElement.value.play()
        isPlaying.value = true
        isPaused.value = false
        console.log('[AudioPlayer] Audio replaying')
      } catch (error) {
        console.error('[AudioPlayer] Error replaying audio:', error)
        handleAudioError(error)
      }
    }
  }

  /**
   * Stop and cleanup audio
   */
  function stopAudio() {
    if (audioElement.value) {
      audioElement.value.pause()
      audioElement.value.removeEventListener('ended', handleAudioEnded)
      audioElement.value.removeEventListener('error', handleAudioError)
      audioElement.value = null
    }

    // Cleanup blob URL
    if (currentAudioUrl.value) {
      URL.revokeObjectURL(currentAudioUrl.value)
      currentAudioUrl.value = null
    }

    isPlaying.value = false
    isPaused.value = false
    currentMessageId.value = null
    console.log('[AudioPlayer] Audio stopped and cleaned up')
  }

  /**
   * Handle audio ended event
   */
  function handleAudioEnded() {
    console.log('[AudioPlayer] Audio playback ended')
    isPlaying.value = false
    isPaused.value = false
  }

  /**
   * Handle audio error
   */
  function handleAudioError(error) {
    console.error('[AudioPlayer] Audio error:', error)
    isPlaying.value = false
    isPaused.value = false
  }

  /**
   * Check if specific message audio is currently active
   * @param {string} messageId - Message identifier
   * @returns {boolean}
   */
  function isActiveAudio(messageId) {
    return currentMessageId.value === messageId
  }

  /**
   * Get audio state for a specific message
   * @param {string} messageId - Message identifier
   * @returns {Object} Audio state
   */
  function getAudioState(messageId) {
    if (currentMessageId.value !== messageId) {
      return { playing: false, paused: false, stopped: true }
    }
    return {
      playing: isPlaying.value,
      paused: isPaused.value,
      stopped: !isPlaying.value && !isPaused.value
    }
  }

  // Cleanup on unmount
  onUnmounted(() => {
    stopAudio()
  })

  return {
    isPlaying,
    isPaused,
    currentMessageId,
    playAudio,
    pauseAudio,
    resumeAudio,
    replayAudio,
    stopAudio,
    isActiveAudio,
    getAudioState
  }
}

