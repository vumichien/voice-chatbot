import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const chatAPI = {
  async sendMessage(message, conversationId = null) {
    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        message,
        conversationId,
        language: 'ja'
      })

      return response.data

    } catch (error) {
      console.error('Chat API error:', error)
      throw error
    }
  },

  async checkHealth() {
    const response = await axios.get(`${API_BASE}/health`)
    return response.data
  }
}
