<template>
  <Transition name="modal">
    <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
      <div class="modal-container" @click.stop>
        <div class="modal-content glass">
          <!-- Icon -->
          <div class="modal-icon">
            <div class="icon-circle glass-light">
              <svg
                class="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          <!-- Title -->
          <h3 class="modal-title text-white">
            {{ title }}
          </h3>

          <!-- Message -->
          <p class="modal-message text-white opacity-80">
            {{ message }}
          </p>

          <!-- Actions -->
          <div class="modal-actions">
            <button
              class="modal-button modal-button-cancel glass-button text-white"
              @click="handleCancel"
            >
              {{ cancelText }}
            </button>
            <button
              class="modal-button modal-button-confirm glass-button text-white"
              @click="handleConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '確認'
  },
  message: {
    type: String,
    default: '実行してもよろしいですか？'
  },
  confirmText: {
    type: String,
    default: '確認'
  },
  cancelText: {
    type: String,
    default: 'キャンセル'
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel', 'update:show'])

function handleConfirm() {
  emit('confirm')
  emit('update:show', false)
}

function handleCancel() {
  emit('cancel')
  emit('update:show', false)
}

function handleOverlayClick() {
  handleCancel()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-container {
  max-width: 400px;
  width: 100%;
}

.modal-content {
  border-radius: 24px;
  padding: 32px;
  text-align: center;
}

.modal-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.icon-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  line-height: 1.3;
}

.modal-message {
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 28px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-button {
  padding: 12px 32px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  border: none;
  outline: none;
  min-width: 120px;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}
</style>
