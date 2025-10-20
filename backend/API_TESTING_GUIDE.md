# API Testing Guide

Complete guide to running and testing the Voice Chatbot backend API.

---

## 📋 Prerequisites

Make sure you have:
- ✅ Node.js installed
- ✅ Dependencies installed (`npm install` already done)
- ✅ `.env` file with required API keys:
  - `HUGGINGFACE_API_KEY`
  - `PINECONE_API_KEY`
  - `OPENROUTER_API_KEY`

---

## 🚀 Method 1: Run Local Development Server (Easiest)

### Step 1: Start the Server

Open a terminal in the `backend` folder:

```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on http://localhost:3000

📡 Available endpoints:
   GET  http://localhost:3000/
   GET  http://localhost:3000/api/health
   POST http://localhost:3000/api/chat

✅ Ready to accept requests!
```

**Keep this terminal open!** The server needs to stay running.

---

### Step 2: Test the API

Open a **NEW terminal window** (keep the server running in the first one):

```bash
cd backend
npm run test:api
```

This will run comprehensive tests including:
- ✅ Health check
- ✅ Validation tests (empty message, too long, etc.)
- ✅ Real chat questions with the knowledge base

---

## 🧪 Method 2: Manual Testing with curl

### Test 1: Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T...",
  "environment": {
    "hasOpenRouter": true,
    "hasHuggingFace": true,
    "hasPinecone": true
  }
}
```

---

### Test 2: Ask a Question

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"青木さんが29歳の時に出会ったものは何ですか？\"}"
```

**Expected Response:**
```json
{
  "response": "青木さんは29歳の時に「バイブル」と出会いました",
  "sources": [
    {
      "text": "...",
      "timestamp": "00:00:00,160 --> 00:05:55,440",
      "topic": "黄金率",
      "relevanceScore": 0.815
    }
  ],
  "conversationId": "conv_...",
  "metadata": {
    "retrievedChunks": 5,
    "processingTime": 5000
  }
}
```

---

### Test 3: Invalid Request (Should Fail)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"\"}"
```

**Expected Response:**
```json
{
  "error": "Message is required"
}
```

---

## 🌐 Method 3: Test with Browser/Postman

### Using Browser Console

1. Open your browser
2. Go to any webpage
3. Open Developer Tools (F12)
4. Go to Console tab
5. Paste this code:

```javascript
fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '黄金率とは何ですか？'
  })
})
.then(res => res.json())
.then(data => console.log(data))
```

---

### Using Postman

1. **Open Postman**
2. **Create New Request**
   - Method: `POST`
   - URL: `http://localhost:3000/api/chat`
3. **Headers**
   - Key: `Content-Type`
   - Value: `application/json`
4. **Body** (Select "raw" and "JSON")
   ```json
   {
     "message": "青木さんが29歳の時に出会ったものは何ですか？"
   }
   ```
5. **Click Send**

---

## 📊 Sample Questions to Test

Try these questions:

### Factual Questions
```json
{ "message": "青木さんが29歳の時に出会ったものは何ですか？" }
```
Expected: バイブル (Bible)

### Conceptual Questions
```json
{ "message": "黄金率とは何ですか？" }
```
Expected: Explanation of Golden Rule

### Advice Questions
```json
{ "message": "価値観が合わない人とどう付き合うべきですか？" }
```
Expected: Advice based on knowledge base

### Unknown Information
```json
{ "message": "青木さんの好きな食べ物は何ですか？" }
```
Expected: "情報がありません" (No information available)

---

## 🔧 Troubleshooting

### Server won't start

**Error**: `Port 3000 is already in use`
- **Solution**: Kill the process using port 3000 or change the port:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F

  # Or use a different port
  PORT=3001 npm start
  ```

---

### API returns error: "OPENROUTER_API_KEY environment variable not set"

- **Solution**: Check your `.env` file has:
  ```env
  OPENROUTER_API_KEY=sk-or-v1-your-key-here
  ```

---

### API returns error: "No relevant information found"

- **Cause**: Vector database might be empty
- **Solution**: Run the pipeline to populate the database:
  ```bash
  node scripts/test-pipeline.js
  ```

---

### Response is slow (>10 seconds)

- **Cause**: Free OpenRouter model can be slow
- **Solution**:
  1. This is normal for free tier
  2. Upgrade to paid model: `openai/gpt-4o-mini` (faster)
  3. Add to `.env`:
     ```env
     OPENROUTER_MODEL=openai/gpt-4o-mini
     ```

---

## 📈 Understanding the Response

### Response Structure

```json
{
  "response": "The AI's answer in Japanese",
  "sources": [
    {
      "text": "Snippet from knowledge base",
      "timestamp": "Video timestamp",
      "topic": "Topic category",
      "relevanceScore": 0.85
    }
  ],
  "conversationId": "Unique conversation ID",
  "metadata": {
    "retrievedChunks": 5,
    "processingTime": 4500
  }
}
```

### Relevance Score

- **0.9 - 1.0**: Highly relevant
- **0.8 - 0.9**: Very relevant
- **0.7 - 0.8**: Moderately relevant
- **< 0.7**: Less relevant

---

## 🎯 Next Steps

After testing locally:

1. **Deploy to Vercel** (Production)
   ```bash
   vercel deploy
   ```

2. **Build Frontend** (Tasks F01-F09)
   - Create Vue.js interface
   - Connect to this API
   - Deploy frontend

3. **Monitor Performance**
   - Check response times
   - Verify accuracy
   - Optimize as needed

---

## 📞 Quick Command Reference

```bash
# Start server
npm start

# Test API (automated)
npm run test:api

# Test with curl
curl http://localhost:3000/api/health

# Ask a question with curl
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Your question here"}'
```

---

## ✅ Success Checklist

- [ ] Server starts without errors
- [ ] Health check returns 200 OK
- [ ] Chat endpoint accepts POST requests
- [ ] Returns answer in Japanese
- [ ] Returns relevant sources with timestamps
- [ ] Response time < 10 seconds
- [ ] Error handling works (empty message, etc.)

---

**Happy Testing! 🎉**

If you encounter any issues, check the server logs for detailed error messages.
