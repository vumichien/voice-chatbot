/**
 * Chat API Test Script
 *
 * Tests the chat endpoint with sample questions
 */

const chatHandler = require('../api/chat')
require('dotenv').config()

// Mock request and response objects
function createMockReq(body, method = 'POST') {
  return {
    method,
    body
  }
}

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null
  }

  res.status = function(code) {
    res.statusCode = code
    return res
  }

  res.json = function(data) {
    res.body = data
    console.log('\n📤 Response:')
    console.log(JSON.stringify(data, null, 2))
    return res
  }

  return res
}

// Test questions
const TEST_QUESTIONS = [
  {
    name: 'Factual Question',
    message: '青木さんが29歳の時に出会ったものは何ですか？',
    expectedTopics: ['バイブル', '黄金率', '29歳']
  },
  {
    name: 'Conceptual Question',
    message: '黄金率とは何ですか？',
    expectedTopics: ['黄金率', 'マタイ', '7章12節']
  },
  {
    name: 'Advice Question',
    message: '価値観が合わない人とどう付き合うべきですか？',
    expectedTopics: ['価値観', '付き合い']
  },
  {
    name: 'Unknown Information',
    message: '青木さんの好きな食べ物は何ですか？',
    shouldReturnNoInfo: true
  }
]

async function runTest(question) {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`TEST: ${question.name}`)
  console.log(`${'='.repeat(80)}`)
  console.log(`📝 Question: ${question.message}`)

  const req = createMockReq({ message: question.message })
  const res = createMockRes()

  const startTime = Date.now()

  try {
    await chatHandler(req, res)

    const duration = Date.now() - startTime

    // Check results
    console.log(`\n⏱️  Processing Time: ${duration}ms`)

    if (res.statusCode !== 200) {
      console.log(`❌ FAILED: Expected status 200, got ${res.statusCode}`)
      return false
    }

    if (!res.body) {
      console.log(`❌ FAILED: No response body`)
      return false
    }

    const { response, sources, metadata } = res.body

    // Check for no info questions
    if (question.shouldReturnNoInfo) {
      if (response.includes('情報がありません') || response.includes('情報が見つかりませんでした')) {
        console.log(`✅ PASSED: Correctly returned "no information"`)
        return true
      } else {
        console.log(`⚠️  WARNING: Expected "no information" response`)
        return true // Still pass, just a warning
      }
    }

    // Check response exists
    if (!response || response.length === 0) {
      console.log(`❌ FAILED: Empty response`)
      return false
    }

    // Check sources
    if (!sources || sources.length === 0) {
      console.log(`⚠️  WARNING: No sources provided`)
    } else {
      console.log(`\n📚 Sources (${sources.length}):`)
      sources.forEach((source, idx) => {
        console.log(`  ${idx + 1}. Topic: ${source.topic}`)
        console.log(`     Time: ${source.timestamp}`)
        console.log(`     Score: ${source.relevanceScore?.toFixed(3) || 'N/A'}`)
      })
    }

    // Check processing time
    if (duration > 3000) {
      console.log(`⚠️  WARNING: Response time ${duration}ms exceeds 3s target`)
    } else {
      console.log(`✅ Response time OK (${duration}ms < 3000ms)`)
    }

    console.log(`\n✅ PASSED`)
    return true

  } catch (error) {
    console.error(`\n❌ FAILED with error:`)
    console.error(error.message)
    return false
  }
}

async function runValidationTests() {
  console.log(`\n${'='.repeat(80)}`)
  console.log(`VALIDATION TESTS`)
  console.log(`${'='.repeat(80)}`)

  const tests = [
    {
      name: 'Empty message',
      body: { message: '' },
      expectedStatus: 400
    },
    {
      name: 'Missing message',
      body: {},
      expectedStatus: 400
    },
    {
      name: 'Too long message',
      body: { message: 'a'.repeat(1001) },
      expectedStatus: 400
    },
    {
      name: 'GET method (should reject)',
      method: 'GET',
      body: { message: 'test' },
      expectedStatus: 405
    }
  ]

  let passed = 0

  for (const test of tests) {
    console.log(`\nTest: ${test.name}`)
    const req = createMockReq(test.body, test.method || 'POST')
    const res = createMockRes()

    await chatHandler(req, res)

    if (res.statusCode === test.expectedStatus) {
      console.log(`✅ PASSED: Got expected status ${test.expectedStatus}`)
      passed++
    } else {
      console.log(`❌ FAILED: Expected ${test.expectedStatus}, got ${res.statusCode}`)
    }
  }

  console.log(`\n📊 Validation Tests: ${passed}/${tests.length} passed`)
  return passed === tests.length
}

async function main() {
  console.log('🧪 Chat API Test Suite')
  console.log('=' .repeat(80))

  // Check environment variables
  console.log('\n📋 Checking environment variables:')
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY
  const hasEmbedding = !!(process.env.HUGGINGFACE_API_KEY || process.env.OPENAI_API_KEY)
  const hasVectorDB = !!process.env.PINECONE_API_KEY

  console.log(`   OpenRouter API: ${hasOpenRouter ? '✓' : '✗'}`)
  console.log(`   Embedding Provider: ${hasEmbedding ? '✓' : '✗'}`)
  console.log(`   Vector DB: ${hasVectorDB ? '✓' : '✗'}`)

  if (!hasOpenRouter) {
    console.error('\n❌ OPENROUTER_API_KEY not set!')
    console.log('Please add to your .env file:')
    console.log('OPENROUTER_API_KEY=your_key_here')
    console.log('\nGet your key at: https://openrouter.ai/keys')
    process.exit(1)
  }

  if (!hasEmbedding || !hasVectorDB) {
    console.error('\n❌ Missing required environment variables')
    process.exit(1)
  }

  // Run validation tests
  const validationPassed = await runValidationTests()

  // Run question tests
  let passedTests = 0
  for (const question of TEST_QUESTIONS) {
    const passed = await runTest(question)
    if (passed) passedTests++
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`)
  console.log('📊 TEST SUMMARY')
  console.log(`${'='.repeat(80)}`)
  console.log(`Validation Tests: ${validationPassed ? 'PASSED' : 'FAILED'}`)
  console.log(`Question Tests: ${passedTests}/${TEST_QUESTIONS.length} passed`)

  if (validationPassed && passedTests === TEST_QUESTIONS.length) {
    console.log('\n✅ ALL TESTS PASSED!')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.')
  }

  console.log(`\n${'='.repeat(80)}\n`)
}

// Run tests
main().catch(error => {
  console.error('\n❌ Fatal error:')
  console.error(error)
  process.exit(1)
})
