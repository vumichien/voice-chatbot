# Embedding Models - Japanese Language Support

## Overview

The embeddings system now supports both **OpenAI** and **HuggingFace** models, with special optimizations for Japanese language content.

## 🎯 Recommended for Japanese

### HuggingFace Models (FREE)

**Best choice for Japanese transcripts:**

1. **multilingual-e5-base** (Default, Recommended)
   - Dimensions: 768
   - Best balance of quality and speed
   - Optimized for Japanese semantic search
   - FREE via HuggingFace API

2. **multilingual-e5-large** (Best Quality)
   - Dimensions: 1024
   - Highest quality for Japanese
   - Slower but more accurate
   - FREE via HuggingFace API

3. **multilingual-e5-small** (Fastest)
   - Dimensions: 384
   - Good for quick prototyping
   - Fast processing
   - FREE via HuggingFace API

## 📦 Installation

Already installed! The required packages are:
- `@huggingface/inference` ✓
- `openai` ✓

## 🔑 Setup

### Option 1: HuggingFace (Recommended for Japanese)

1. Get a free API token at: https://huggingface.co/settings/tokens
2. Add to `.env`:
   ```bash
   HUGGINGFACE_API_KEY=your_token_here
   ```

### Option 2: OpenAI (Paid)

1. Get API key at: https://platform.openai.com/api-keys
2. Add to `.env`:
   ```bash
   OPENAI_API_KEY=your_key_here
   ```

## 🚀 Usage

### List Available Models

```bash
node scripts/list-embedding-models.js
```

### Test with Real Data

```bash
node scripts/test-embeddings.js
```

The script will:
- Auto-detect which provider you have configured
- Use HuggingFace if available (recommended)
- Fall back to OpenAI if only that is configured
- Default model: `multilingual-e5-base` (best for Japanese)

### Programmatic Usage

```javascript
const { generateEmbeddings } = require('./lib/embeddings')

// Using HuggingFace (default)
const result = await generateEmbeddings(chunksData, {
  provider: 'huggingface',
  model: 'multilingual-e5-base'  // or 'multilingual-e5-large', 'multilingual-e5-small'
})

// Using OpenAI
const result = await generateEmbeddings(chunksData, {
  provider: 'openai',
  model: 'openai-small'  // or 'openai-large'
})
```

## 🔧 Available Models

| Model Alias | Full Name | Dimensions | Provider | Cost | Best For |
|-------------|-----------|------------|----------|------|----------|
| `multilingual-e5-large` | intfloat/multilingual-e5-large | 1024 | HuggingFace | FREE | Best quality Japanese |
| `multilingual-e5-base` | intfloat/multilingual-e5-base | 768 | HuggingFace | FREE | Recommended Japanese |
| `multilingual-e5-small` | intfloat/multilingual-e5-small | 384 | HuggingFace | FREE | Fast Japanese |
| `paraphrase-multilingual` | sentence-transformers/... | 384 | HuggingFace | FREE | Lightweight multilingual |
| `openai-small` | text-embedding-3-small | 1536 | OpenAI | $0.02/1M tokens | General purpose |
| `openai-large` | text-embedding-3-large | 3072 | OpenAI | Higher | High accuracy |

## 🎓 Why E5 Models for Japanese?

The **Multilingual E5** models are specifically designed for cross-lingual semantic search and perform exceptionally well on Japanese text because:

1. **Trained on Japanese data** - Part of the multilingual training corpus
2. **Semantic understanding** - Better at understanding Japanese context
3. **Query prefix optimization** - Uses "query: " prefix for better retrieval
4. **Free and open source** - No API costs
5. **Proven performance** - High scores on Japanese retrieval benchmarks

## 💡 Tips

### For Production

- Use `multilingual-e5-base` or `multilingual-e5-large`
- HuggingFace API is free but has rate limits
- Consider caching embeddings

### For Development

- Use `multilingual-e5-small` for faster iteration
- Test with different models to compare quality

### For Maximum Accuracy

- Use `multilingual-e5-large` (1024 dims)
- Ensure vector DB supports 1024 dimensions
- Update Pinecone/Upstash index configuration

## 🔄 Migration from OpenAI

If you were using OpenAI embeddings:

1. **Dimensions changed**: OpenAI uses 1536 dims, E5-base uses 768 dims
2. **Update vector DB**: Recreate index with new dimensions
3. **Re-generate embeddings**: Run the pipeline again with new model
4. **Cost savings**: HuggingFace is free!

### Update Vector DB Index

For Pinecone:
```javascript
// Change dimension from 1536 to 768 (or 1024 for e5-large)
{
  name: "transcript-knowledge",
  dimension: 768,  // Changed from 1536
  metric: "cosine"
}
```

## 🧪 Testing

Run the full pipeline with HuggingFace:

```bash
# 1. Set up HuggingFace token
echo "HUGGINGFACE_API_KEY=your_token" >> .env

# 2. Run embedding generation
node scripts/test-embeddings.js

# Output will show:
# ✓ Using huggingface provider
# ✓ Model: multilingual-e5-base
# 🔄 Generating embeddings for 8 chunks...
#    Provider: huggingface
#    Model: intfloat/multilingual-e5-base
#    Dimensions: 768
#    Cost: FREE
```

## 📊 Performance Comparison

For 8 chunks (Japanese transcript):

| Model | Dimensions | Time | Cost | Quality |
|-------|------------|------|------|---------|
| multilingual-e5-large | 1024 | ~4s | FREE | ⭐⭐⭐⭐⭐ |
| multilingual-e5-base | 768 | ~3s | FREE | ⭐⭐⭐⭐ |
| multilingual-e5-small | 384 | ~2s | FREE | ⭐⭐⭐ |
| openai-small | 1536 | ~2s | $0.0003 | ⭐⭐⭐⭐ |

**Recommendation**: Use `multilingual-e5-base` for best balance of quality, speed, and cost (FREE!).

## 🆘 Troubleshooting

### "HUGGINGFACE_API_KEY not found"

Solution: Create a free token at https://huggingface.co/settings/tokens and add to `.env`

### "Model loading timeout"

Solution: HuggingFace may be loading the model for the first time. Wait 30s and retry.

### "Wrong dimensions in vector DB"

Solution: Delete and recreate the vector DB index with the correct dimensions for your chosen model.

### "Rate limit exceeded"

Solution: HuggingFace free tier has rate limits. Add delays between requests or upgrade to Pro.

## 📚 References

- [Multilingual E5 Paper](https://arxiv.org/abs/2402.05672)
- [HuggingFace Model Card](https://huggingface.co/intfloat/multilingual-e5-base)
- [Sentence Transformers](https://www.sbert.net/)

---

**Updated**: 2025-01-20
**Version**: 2.0 (Added HuggingFace support)
