/**
 * LLM Service
 * 
 * Unified interface for multiple LLM providers:
 * - OpenAI
 * - OpenRouter
 * - (Future: Anthropic, Google, etc.)
 */

const axios = require('axios')

/**
 * Call OpenAI API
 */
async function callOpenAI({ system, conversationHistory, currentMessage, model, temperature = 0.8, maxTokens = 600 }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable not set')
  }

  try {
    // Build messages array: system + conversation history + current message
    const messages = [
      { role: 'system', content: system }
    ]

    // Add conversation history (exclude the current message if already in history)
    if (conversationHistory && conversationHistory.length > 0) {
      const historyMessages = conversationHistory
        .filter(msg => msg.content !== currentMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      messages.push(...historyMessages)
    }

    // Add current user message
    messages.push({ role: 'user', content: currentMessage })

    console.log(`[OpenAI] Sending ${messages.length} messages to LLM (model: ${model})`)

    // GPT-5 models have specific requirements:
    // - Use max_completion_tokens instead of max_tokens
    // - Only support default temperature (1), cannot be customized
    const isGPT5Model = model && model.startsWith('gpt-5')
    const requestBody = {
      model,
      messages
    }

    // Set parameters based on model type
    if (isGPT5Model) {
      // GPT-5 models are reasoning models (similar to o1/o3)
      // They only support max_completion_tokens (NOT max_output_tokens or max_tokens)
      // max_completion_tokens limits the TOTAL tokens (reasoning + output)
      
      // GPT-5 specific parameters:
      // 1. reasoning_effort: Controls how much reasoning the model does
      //    - 'minimal': Least reasoning, fastest, most output tokens available
      //    - 'low': Low reasoning
      //    - 'medium': Medium reasoning (default)
      //    - 'high': Deep reasoning, slower, uses more tokens for thinking
      requestBody.reasoning_effort = 'minimal'  // Use minimal reasoning to maximize output tokens
      
      // 2. max_completion_tokens: Total tokens (reasoning + output)
      //    With 'minimal' reasoning, most tokens will be used for output
      //    So we can use a lower value - close to desired output length
      requestBody.max_completion_tokens = Math.max(1200, maxTokens * 2)
      
      console.log(`[OpenAI] GPT-5 model detected - reasoning_effort: ${requestBody.reasoning_effort}, max_completion_tokens: ${requestBody.max_completion_tokens}`)
      // GPT-5 reasoning models only support default temperature (1), don't include it
    } else {
      requestBody.max_tokens = maxTokens
      requestBody.temperature = temperature
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    )

    // Debug: Log response structure
    console.log('[OpenAI] Response status:', response.status)
    
    // Check if response has choices
    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      console.error('[OpenAI] No choices in response:', JSON.stringify(response.data, null, 2))
      throw new Error('OpenAI API returned no choices in response')
    }

    const choice = response.data.choices[0]
    const finishReason = choice?.finish_reason
    const content = choice?.message?.content
    
    console.log('[OpenAI] Finish reason:', finishReason)
    console.log('[OpenAI] Content type:', typeof content)
    console.log('[OpenAI] Content length:', content?.length || 0)
    
    // Log full choice for debugging if content is empty
    if (!content || content.trim().length === 0) {
      console.error('[OpenAI] Empty or null content. Full choice:', JSON.stringify(choice, null, 2))
      console.error('[OpenAI] Full response data:', JSON.stringify(response.data, null, 2))
      
      // If finish_reason is 'length', it means max tokens reached but might still have content
      if (finishReason === 'length') {
        console.warn('[OpenAI] Response was truncated due to max tokens')
      }
      
      throw new Error(`OpenAI API returned empty content (finish_reason: ${finishReason})`)
    }

    return content
  } catch (error) {
    if (error.response) {
      console.error('[OpenAI] API Error:', error.response.data)
      throw new Error(`OpenAI API error: ${error.response.data.error?.message || error.response.statusText}`)
    } else if (error.request) {
      console.error('[OpenAI] No response received')
      throw new Error('OpenAI API timeout or network error')
    } else {
      throw error
    }
  }
}

/**
 * Call OpenRouter API
 */
async function callOpenRouter({ system, conversationHistory, currentMessage, model, temperature = 0.8, maxTokens = 600 }) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY environment variable not set')
  }

  try {
    // Build messages array: system + conversation history + current message
    const messages = [
      { role: 'system', content: system }
    ]

    // Add conversation history (exclude the current message if already in history)
    if (conversationHistory && conversationHistory.length > 0) {
      const historyMessages = conversationHistory
        .filter(msg => msg.content !== currentMessage)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      messages.push(...historyMessages)
    }

    // Add current user message
    messages.push({ role: 'user', content: currentMessage })

    console.log(`[OpenRouter] Sending ${messages.length} messages to LLM (model: ${model})`)

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages,
        temperature,
        max_tokens: maxTokens
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
          'X-Title': 'Voice Chatbot Knowledge Base'
        },
        timeout: 30000 // 30 second timeout
      }
    )

    return response.data.choices[0].message.content
  } catch (error) {
    if (error.response) {
      console.error('[OpenRouter] API Error:', error.response.data)
      throw new Error(`OpenRouter API error: ${error.response.data.error?.message || error.response.statusText}`)
    } else if (error.request) {
      console.error('[OpenRouter] No response received')
      throw new Error('OpenRouter API timeout or network error')
    } else {
      throw error
    }
  }
}

/**
 * Main LLM call function - routes to appropriate provider
 * 
 * @param {Object} options
 * @param {string} options.provider - 'openai' or 'openrouter'
 * @param {string} options.system - System prompt
 * @param {Array} options.conversationHistory - Previous messages
 * @param {string} options.currentMessage - Current user message
 * @param {string} options.model - Model name/identifier
 * @param {number} options.temperature - Temperature (0-2)
 * @param {number} options.maxTokens - Max tokens
 * @returns {Promise<string>} LLM response text
 */
async function callLLM(options = {}) {
  const {
    provider = process.env.LLM_PROVIDER || 'openai',
    system,
    conversationHistory = [],
    currentMessage,
    model,
    temperature = parseFloat(process.env.LLM_TEMPERATURE) || 0.8,
    maxTokens = parseInt(process.env.LLM_MAX_TOKENS) || 600
  } = options

  // Get model from options or environment
  let modelName = model
  if (!modelName) {
    if (provider === 'openai') {
      modelName = process.env.OPENAI_MODEL || 'gpt-5-nano'
    } else if (provider === 'openrouter') {
      modelName = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-exp:free'
    }
  }

  if (!modelName) {
    throw new Error(`Model not specified for provider: ${provider}`)
  }

  console.log(`[LLM Service] Using provider: ${provider}, model: ${modelName}`)

  // Route to appropriate provider
  if (provider === 'openai') {
    return await callOpenAI({
      system,
      conversationHistory,
      currentMessage,
      model: modelName,
      temperature,
      maxTokens
    })
  } else if (provider === 'openrouter') {
    return await callOpenRouter({
      system,
      conversationHistory,
      currentMessage,
      model: modelName,
      temperature,
      maxTokens
    })
  } else {
    throw new Error(`Unsupported LLM provider: ${provider}. Supported providers: openai, openrouter`)
  }
}

/**
 * Check if a provider is configured
 */
function isProviderConfigured(provider) {
  if (provider === 'openai') {
    return !!process.env.OPENAI_API_KEY
  } else if (provider === 'openrouter') {
    return !!process.env.OPENROUTER_API_KEY
  }
  return false
}

/**
 * Get configured provider
 */
function getConfiguredProvider() {
  const provider = process.env.LLM_PROVIDER || 'openai'
  
  // Check if the configured provider has API key
  if (isProviderConfigured(provider)) {
    return provider
  }
  
  // Fallback: try to find any configured provider
  if (isProviderConfigured('openai')) {
    return 'openai'
  }
  if (isProviderConfigured('openrouter')) {
    return 'openrouter'
  }
  
  return null
}

/**
 * Get available providers
 */
function getAvailableProviders() {
  const providers = []
  if (isProviderConfigured('openai')) {
    providers.push('openai')
  }
  if (isProviderConfigured('openrouter')) {
    providers.push('openrouter')
  }
  return providers
}

module.exports = {
  callLLM,
  callOpenAI,
  callOpenRouter,
  isProviderConfigured,
  getConfiguredProvider,
  getAvailableProviders
}

