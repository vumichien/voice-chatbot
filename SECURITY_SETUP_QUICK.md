# 🔒 API Security - Quick Setup Guide

## ✅ What's Been Done

Your API now has **3 security layers**:

1. **✅ API Key Authentication** - Implemented
2. **✅ Rate Limiting** (10 req/min) - Implemented
3. **✅ CORS Protection** - Implemented

---

## 🔑 Your API Keys

**Development Key** (already added to `backend/.env`):
```
63fc612e840cf173a8c198a20fe4aa93bdf3fecbf5f28ffc23a1530c19b30a37
```

**Production Key** (save this for Vercel deployment):
```
26f659ef632ea088a5526940a64ff80be0ef103576aa1310c36c30bb0c7756b0
```

---

## 📝 Next Steps

### Step 1: Update Frontend (Required)

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:3000
VITE_API_KEY=63fc612e840cf173a8c198a20fe4aa93bdf3fecbf5f28ffc23a1530c19b30a37
```

### Step 2: Update Frontend API Service

In `frontend/src/App.vue` or wherever you call the API, add the API key header:

```javascript
// Before (Not Secure ❌)
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message })
})

// After (Secure ✅)
const API_KEY = import.meta.env.VITE_API_KEY

const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY  // ✅ Add this line
  },
  body: JSON.stringify({ message })
})
```

### Step 3: Test Locally

```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm run dev

# Test in browser - should work with API key!
```

### Step 4: Deploy to Production

```bash
# Add production API key to Vercel
cd backend
echo -n "26f659ef632ea088a5526940a64ff80be0ef103576aa1310c36c30bb0c7756b0" | vercel env add API_KEYS production

# Add your frontend domain
echo -n "https://your-frontend.vercel.app" | vercel env add ALLOWED_ORIGINS production

# Redeploy
vercel --prod
```

---

## 🧪 Test Security

### Test 1: Without API Key (Should Fail ❌)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'

# Expected: {"error":"API key required"}
```

### Test 2: With API Key (Should Work ✅)

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 63fc612e840cf173a8c198a20fe4aa93bdf3fecbf5f28ffc23a1530c19b30a37" \
  -d '{"message":"青木さんについて教えてください"}'

# Expected: {"response":"...","sources":[...]}
```

### Test 3: Rate Limiting (Should Block After 10 Requests)

```bash
# Send 15 requests quickly
for i in {1..15}; do
  echo "Request $i"
  curl -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" \
    -H "X-API-Key: 63fc612e840cf173a8c198a20fe4aa93bdf3fecbf5f28ffc23a1530c19b30a37" \
    -d '{"message":"test"}'
  echo ""
done

# After request 10: {"error":"Rate limit exceeded","retryAfter":XX}
```

---

## 🛡️ Security Features

| Feature | Chat API | Health API |
|---------|----------|------------|
| API Key Required | ✅ Yes | ❌ No |
| Rate Limit | 10/min | 30/min |
| CORS Enabled | ✅ Yes | ✅ Yes |

---

## 🆘 Common Errors

### Error: "API key required"
**Fix**: Add `X-API-Key` header to your requests

### Error: "Invalid API key"
**Fix**: Check your API key matches `backend/.env`

### Error: "Rate limit exceeded"
**Fix**: Wait 1 minute, then retry

### CORS Error in Browser
**Fix**: Make sure `ALLOWED_ORIGINS` includes your frontend domain

---

## 📚 Full Documentation

For complete details, see: **SECURITY_GUIDE.md**

---

**Your API is now secure! 🎉**

Next: Update your frontend to include the API key in all requests.
