/**
 * Audio Settings Store
 * 
 * Manages audio playback settings with localStorage persistence
 */

import { ref, watch } from 'vue'

const STORAGE_KEY = 'audioSettings'

// Default settings
const defaultSettings = {
  autoPlay: true
}

// Load settings from localStorage
function loadSettings() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('[AudioSettings] Error loading settings:', error)
  }
  return defaultSettings
}

// Save settings to localStorage
function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    console.log('[AudioSettings] Settings saved:', settings)
  } catch (error) {
    console.error('[AudioSettings] Error saving settings:', error)
  }
}

// Create reactive settings
const settings = ref(loadSettings())

// Watch for changes and persist
watch(settings, (newSettings) => {
  saveSettings(newSettings)
}, { deep: true })

/**
 * Audio Settings Composable
 */
export function useAudioSettings() {
  /**
   * Toggle auto-play on/off
   */
  function toggleAutoPlay() {
    settings.value.autoPlay = !settings.value.autoPlay
    console.log('[AudioSettings] Auto-play toggled:', settings.value.autoPlay)
  }

  /**
   * Set auto-play value
   * @param {boolean} value - Auto-play enabled
   */
  function setAutoPlay(value) {
    settings.value.autoPlay = !!value
    console.log('[AudioSettings] Auto-play set to:', settings.value.autoPlay)
  }

  /**
   * Get auto-play setting
   * @returns {boolean}
   */
  function getAutoPlay() {
    return settings.value.autoPlay
  }

  /**
   * Reset settings to defaults
   */
  function resetSettings() {
    settings.value = { ...defaultSettings }
    console.log('[AudioSettings] Settings reset to defaults')
  }

  return {
    settings,
    autoPlay: () => settings.value.autoPlay,
    toggleAutoPlay,
    setAutoPlay,
    getAutoPlay,
    resetSettings
  }
}

