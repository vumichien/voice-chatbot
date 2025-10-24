/**
 * Chat Logger Service
 * Handles logging chat conversations to localStorage
 * Creates new log files when clearing chat
 */

const LOG_PREFIX = 'chat_log_'
const LOG_INDEX_KEY = 'chat_log_index'

export const chatLogger = {
  /**
   * Create a new log with unique ID
   * @param {string} title - Optional session title
   * @returns {string} Log ID
   */
  createNewLog(title = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const logId = `${LOG_PREFIX}${timestamp}`

    // Initialize empty log
    const logData = {
      id: logId,
      title: title || '新しいチャット',
      preview: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
      messageCount: 0,
      status: 'active'
    }

    localStorage.setItem(logId, JSON.stringify(logData))

    // Add to index
    this.addToIndex(logId)

    console.log(`[Logger] Created new log: ${logId}`)
    return logId
  },

  /**
   * Save messages to a log
   * @param {string} logId - Log ID
   * @param {Array} messages - Messages array
   * @param {boolean} finalize - Whether this is the final save (chat cleared)
   */
  saveLog(logId, messages, finalize = false) {
    try {
      const existingLog = localStorage.getItem(logId)
      let logData

      if (existingLog) {
        logData = JSON.parse(existingLog)
      } else {
        logData = {
          id: logId,
          title: '新しいチャット',
          preview: '',
          createdAt: new Date().toISOString(),
          messages: [],
          status: 'active'
        }
      }

      // Update log data
      logData.messages = messages
      logData.updatedAt = new Date().toISOString()
      logData.messageCount = messages.length

      // Auto-generate title from first user message
      if (messages.length > 0 && (!logData.title || logData.title === '新しいチャット')) {
        const firstUserMessage = messages.find(msg => msg.role === 'user')
        if (firstUserMessage) {
          logData.title = firstUserMessage.content.substring(0, 50) +
                         (firstUserMessage.content.length > 50 ? '...' : '')
        }
      }

      // Generate preview from messages
      if (messages.length > 0) {
        const previewText = messages
          .slice(0, 3)
          .map(msg => msg.content.substring(0, 30))
          .join(' | ')
        logData.preview = previewText.substring(0, 100)
      }

      if (finalize) {
        logData.status = 'completed'
        logData.completedAt = new Date().toISOString()
      }

      localStorage.setItem(logId, JSON.stringify(logData))

      if (finalize) {
        console.log(`[Logger] Finalized log: ${logId} (${messages.length} messages)`)
      }
    } catch (error) {
      console.error('[Logger] Error saving log:', error)
    }
  },

  /**
   * Add log ID to index
   * @param {string} logId - Log ID
   */
  addToIndex(logId) {
    try {
      const indexData = localStorage.getItem(LOG_INDEX_KEY)
      let index = indexData ? JSON.parse(indexData) : []

      if (!index.includes(logId)) {
        index.push(logId)
        localStorage.setItem(LOG_INDEX_KEY, JSON.stringify(index))
      }
    } catch (error) {
      console.error('[Logger] Error updating index:', error)
    }
  },

  /**
   * Get all log IDs
   * @returns {Array} Array of log IDs
   */
  getAllLogIds() {
    try {
      const indexData = localStorage.getItem(LOG_INDEX_KEY)
      return indexData ? JSON.parse(indexData) : []
    } catch (error) {
      console.error('[Logger] Error getting log index:', error)
      return []
    }
  },

  /**
   * Get a specific log
   * @param {string} logId - Log ID
   * @returns {Object|null} Log data or null
   */
  getLog(logId) {
    try {
      const logData = localStorage.getItem(logId)
      return logData ? JSON.parse(logData) : null
    } catch (error) {
      console.error('[Logger] Error getting log:', error)
      return null
    }
  },

  /**
   * Get all logs
   * @returns {Array} Array of log objects
   */
  getAllLogs() {
    const logIds = this.getAllLogIds()
    return logIds.map(id => this.getLog(id)).filter(Boolean)
  },

  /**
   * List all sessions with metadata (sorted by most recent)
   * @returns {Array} Array of session metadata
   */
  listSessions() {
    const logs = this.getAllLogs()

    // Map to session metadata
    const sessions = logs.map(log => ({
      id: log.id,
      title: log.title || '新しいチャット',
      preview: log.preview || '',
      messageCount: log.messageCount || log.messages?.length || 0,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
      status: log.status
    }))

    // Sort by most recent first
    sessions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

    return sessions
  },

  /**
   * Load a specific session
   * @param {string} sessionId - Session ID to load
   * @returns {Object|null} Session data with messages
   */
  loadSession(sessionId) {
    try {
      const session = this.getLog(sessionId)
      if (!session) {
        console.error(`[Logger] Session not found: ${sessionId}`)
        return null
      }

      console.log(`[Logger] Loaded session: ${sessionId} (${session.messageCount} messages)`)
      return {
        id: session.id,
        title: session.title,
        messages: session.messages || [],
        conversationId: session.conversationId || null,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      }
    } catch (error) {
      console.error('[Logger] Error loading session:', error)
      return null
    }
  },

  /**
   * Delete a log
   * @param {string} logId - Log ID
   */
  deleteLog(logId) {
    try {
      localStorage.removeItem(logId)

      // Remove from index
      const indexData = localStorage.getItem(LOG_INDEX_KEY)
      if (indexData) {
        let index = JSON.parse(indexData)
        index = index.filter(id => id !== logId)
        localStorage.setItem(LOG_INDEX_KEY, JSON.stringify(index))
      }

      console.log(`[Logger] Deleted log: ${logId}`)
    } catch (error) {
      console.error('[Logger] Error deleting log:', error)
    }
  },

  /**
   * Export log as JSON
   * @param {string} logId - Log ID
   * @returns {string} JSON string
   */
  exportLog(logId) {
    const log = this.getLog(logId)
    if (!log) return null

    return JSON.stringify(log, null, 2)
  },

  /**
   * Download log as file
   * @param {string} logId - Log ID
   */
  downloadLog(logId) {
    const logJson = this.exportLog(logId)
    if (!logJson) return

    const blob = new Blob([logJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${logId}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  /**
   * Get storage statistics
   * @returns {Object} Storage stats
   */
  getStats() {
    const logs = this.getAllLogs()
    const totalMessages = logs.reduce((sum, log) => sum + (log.messageCount || 0), 0)

    return {
      totalLogs: logs.length,
      totalMessages,
      activeLogs: logs.filter(log => log.status === 'active').length,
      completedLogs: logs.filter(log => log.status === 'completed').length
    }
  }
}
