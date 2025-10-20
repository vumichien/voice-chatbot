/**
 * Live API Test Script
 *
 * Tests the running API server with real HTTP requests
 */

const axios = require('axios')

const API_URL = process.env.API_URL || 'http://localhost:3000'

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testHealthCheck() {
  log('cyan', '\n' + '='.repeat(80))
  log('cyan', 'TEST 1: Health Check')
  log('cyan', '='.repeat(80))

  try {
    const response = await axios.get(`${API_URL}/api/health`)

    log('green', '✅ Health check passed')
    console.log('\nResponse:')
    console.log(JSON.stringify(response.data, null, 2))

    return true
  } catch (error) {
    log('red', `❌ Health check failed: ${error.message}`)
    return false
  }
}

async function testChatAPI(question, testName) {
  log('cyan', '\n' + '='.repeat(80))
  log('cyan', `TEST: ${testName}`)
  log('cyan', '='.repeat(80))
  log('blue', `Question: ${question}`)

  const startTime = Date.now()

  try {
    const response = await axios.post(
      `${API_URL}/api/chat`,
      { message: question },
      { headers: { 'Content-Type': 'application/json' } }
    )

    const duration = Date.now() - startTime

    log('green', `✅ Request successful (${duration}ms)`)

    console.log('\n📝 Response:')
    console.log(response.data.response)

    if (response.data.sources && response.data.sources.length > 0) {
      console.log(`\n📚 Sources (${response.data.sources.length}):`)
      response.data.sources.forEach((source, idx) => {
        console.log(`  ${idx + 1}. [${source.timestamp}] ${source.topic}`)
        console.log(`     Score: ${source.relevanceScore?.toFixed(3)}`)
        console.log(`     Text: ${source.text.substring(0, 100)}...`)
      })
    }

    console.log('\n⏱️  Processing time:', response.data.metadata?.processingTime, 'ms')

    return true
  } catch (error) {
    log('red', `❌ Request failed: ${error.message}`)
    if (error.response) {
      console.log('\nError response:', error.response.data)
    }
    return false
  }
}

async function testInvalidRequests() {
  log('cyan', '\n' + '='.repeat(80))
  log('cyan', 'TEST: Invalid Requests')
  log('cyan', '='.repeat(80))

  const tests = [
    { name: 'Empty message', data: { message: '' }, expectedStatus: 400 },
    { name: 'Missing message', data: {}, expectedStatus: 400 },
    { name: 'Too long message', data: { message: 'a'.repeat(1001) }, expectedStatus: 400 }
  ]

  let passed = 0

  for (const test of tests) {
    try {
      await axios.post(`${API_URL}/api/chat`, test.data)
      log('red', `❌ ${test.name}: Should have failed but didn't`)
    } catch (error) {
      if (error.response && error.response.status === test.expectedStatus) {
        log('green', `✅ ${test.name}: Correctly rejected with ${test.expectedStatus}`)
        passed++
      } else {
        log('red', `❌ ${test.name}: Got status ${error.response?.status} instead of ${test.expectedStatus}`)
      }
    }
  }

  console.log(`\nValidation Tests: ${passed}/${tests.length} passed`)
  return passed === tests.length
}

async function main() {
  log('blue', '\n🧪 Live API Test Suite')
  log('blue', `Testing server at: ${API_URL}\n`)

  // Test 1: Health check
  const healthOk = await testHealthCheck()

  if (!healthOk) {
    log('red', '\n❌ Server is not running or not responding!')
    log('yellow', '\nPlease start the server first:')
    log('yellow', '  cd backend')
    log('yellow', '  node server.js')
    process.exit(1)
  }

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000))

  // Test 2: Invalid requests
  await testInvalidRequests()

  await new Promise(resolve => setTimeout(resolve, 1000))

  // Test 3: Real questions
  const questions = [
    { q: '青木さんが29歳の時に出会ったものは何ですか？', name: 'Factual Question' },
    { q: '黄金率とは何ですか？', name: 'Conceptual Question' },
    { q: '価値観が合わない人とどう付き合うべきですか？', name: 'Advice Question' }
  ]

  for (const { q, name } of questions) {
    await testChatAPI(q, name)
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  log('green', '\n' + '='.repeat(80))
  log('green', '✅ All tests complete!')
  log('green', '='.repeat(80) + '\n')
}

main().catch(error => {
  log('red', `\n❌ Fatal error: ${error.message}`)
  process.exit(1)
})
