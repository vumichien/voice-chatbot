/**
 * List Available Embedding Models
 *
 * Shows all available embedding models for Japanese text
 */

const { listModels } = require('../lib/embeddings')

console.log('🎯 Voice Chatbot - Embedding Models for Japanese\n')
console.log('=' .repeat(80))

listModels()

console.log('=' .repeat(80))
console.log('\n📝 Recommendations:')
console.log('\n  For Japanese Content:')
console.log('  1. multilingual-e5-base (Recommended) - Best balance')
console.log('  2. multilingual-e5-large - Best quality')
console.log('  3. multilingual-e5-small - Fastest')
console.log('\n  For General Multilingual:')
console.log('  1. paraphrase-multilingual - Lightweight')
console.log('\n  For Maximum Compatibility:')
console.log('  1. openai-small - Works well but costs money')
console.log('\n💡 HuggingFace models are FREE!')
console.log('   Get your token at: https://huggingface.co/settings/tokens\n')
