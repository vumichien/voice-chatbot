# 🔒 API Security Guide

## Overview

Your API is now protected with **3 layers of security**:

1. **API Key Authentication** - Frontend must provide a valid API key
2. **Rate Limiting** - Prevents abuse (10 requests/minute per IP for chat, 30 for health)
3. **CORS Protection** - Controls which domains can access your API

---

## 🔑 Step 1: Generate API Keys

### Generate a Secure API Key

Run this command to generate a cryptographically secure API key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output**: `a3f8b9c2d1e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0`

You can generate multiple keys (one per environment):
- Development key
- Production key
- Mobile app key (if needed)

---

## ⚙️ Step 2: Configure Backend Security

### Local Development (.env)

Add to your `backend/.env`:

```bash
# Security Configuration
API_KEYS=a3f8b9c2d1e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0

# Allow all origins in development
ALLOWED_ORIGINS=*

# Or specify specific origins:
# ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
```

### Production (Vercel)

Add environment variables to Vercel:

```bash
# Generate production API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to Vercel
cd backend
echo -n "YOUR_GENERATED_KEY_HERE" | vercel env add API_KEYS production

# Add allowed origins (your frontend domain)
echo -n "https://your-frontend.vercel.app" | vercel env add ALLOWED_ORIGINS production
```

**Important**: Use a **different** API key for production than development!

---

## 🌐 Step 3: Update Frontend

### Add API Key to Frontend Environment

Create/update `frontend/.env`:

```bash
# Backend API URL
VITE_API_URL=https://backend-hiygz6v50-vumichies-projects.vercel.app

# Frontend API Key (matches backend API_KEYS)
VITE_API_KEY=a3f8b9c2d1e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w2x3y4z5a6b7c8d9e0
```

### Update Frontend API Service

Update your `frontend/src/services/api.js` (or wherever you make API calls):

```javascript
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_KEY = import.meta.env.VITE_API_KEY

// Create axios instance with default headers
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY  // ✅ Add API key to all requests
  }
})

// Send message to chatbot
export async function sendMessage(message, conversationId = null, conversationHistory = []) {
  try {
    const response = await api.post('/api/chat', {
      message,
      conversationId,
      conversationHistory,
      language: 'ja'
    })
    return response.data
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message)
    throw error
  }
}

// Health check
export async function checkHealth() {
  try {
    const response = await api.get('/api/health')
    return response.data
  } catch (error) {
    console.error('Health check failed:', error)
    throw error
  }
}

export default api
```

**Alternative: Using fetch()**:

```javascript
const API_BASE = import.meta.env.VITE_API_URL
const API_KEY = import.meta.env.VITE_API_KEY

async function sendMessage(message) {
  const response = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY  // ✅ Add API key
    },
    body: JSON.stringify({ message })
  })

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Too many requests. Please try again later.')
    }
    if (response.status === 401) {
      throw new Error('Invalid API key')
    }
    throw new Error('API request failed')
  }

  return response.json()
}
```

---

## 🧪 Step 4: Test Security

### Test Without API Key (Should Fail)

```bash
# This should return 401 Unauthorized
curl -X POST https://backend-hiygz6v50-vumichies-projects.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test"}'
```

**Expected response**:
```json
{
  "error": "API key required"
}
```

### Test With Valid API Key (Should Work)

```bash
# This should work
curl -X POST https://backend-hiygz6v50-vumichies-projects.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{"message":"青木さんについて教えてください"}'
```

### Test Rate Limiting

```bash
# Send 15 requests quickly (limit is 10/minute)
for i in {1..15}; do
  echo "Request $i"
  curl -X POST https://backend-hiygz6v50-vumichies-projects.vercel.app/api/chat \
    -H "Content-Type: application/json" \
    -H "X-API-Key: YOUR_API_KEY_HERE" \
    -d '{"message":"test"}' &
done
wait

# After 10 requests, you should see:
# {"error":"Rate limit exceeded","retryAfter":XX}
```

---

## 🛡️ Security Features Explained

### 1. API Key Authentication

**How it works**:
- Frontend sends API key in `X-API-Key` header
- Backend validates key against `API_KEYS` environment variable
- Multiple keys supported (comma-separated)

**Benefits**:
- ✅ Prevents unauthorized access
- ✅ Can revoke keys if compromised
- ✅ Different keys for different environments

**Limitations**:
- ⚠️ API key is visible in frontend code
- ⚠️ Users can extract key from network requests
- ⚠️ Good for preventing casual abuse, not sophisticated attacks

### 2. Rate Limiting

**How it works**:
- Tracks requests per IP address
- 10 requests/minute for `/api/chat`
- 30 requests/minute for `/api/health`
- Returns 429 error when limit exceeded

**Benefits**:
- ✅ Prevents abuse and bot attacks
- ✅ Protects against accidental infinite loops
- ✅ Reduces API costs (OpenRouter, embeddings)

**Limitations**:
- ⚠️ In-memory store (resets on server restart)
- ⚠️ Use Redis for production multi-instance setup

### 3. CORS Protection

**How it works**:
- Controls which domains can access API
- Validates `Origin` header
- Supports wildcard subdomain matching

**Benefits**:
- ✅ Prevents unauthorized websites from using your API
- ✅ Browsers enforce CORS automatically

**Limitations**:
- ⚠️ Only works in browsers (not for curl/postman)
- ⚠️ Can be bypassed by server-side requests

---

## 🚀 Production Deployment Steps

### 1. Generate Production API Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output: `YOUR_PRODUCTION_KEY`

### 2. Add to Vercel Backend

```bash
cd backend
echo -n "YOUR_PRODUCTION_KEY" | vercel env add API_KEYS production
echo -n "https://your-frontend.vercel.app" | vercel env add ALLOWED_ORIGINS production
```

### 3. Redeploy Backend

```bash
vercel --prod
```

### 4. Add to Frontend .env

```bash
# frontend/.env.production
VITE_API_URL=https://backend-hiygz6v50-vumichies-projects.vercel.app
VITE_API_KEY=YOUR_PRODUCTION_KEY
```

### 5. Deploy Frontend

```bash
cd frontend
vercel --prod
```

---

## 🔐 Best Practices

### ✅ DO

1. **Use different API keys** for development and production
2. **Rotate keys periodically** (every 3-6 months)
3. **Monitor logs** for unauthorized access attempts
4. **Set up alerts** for rate limit violations
5. **Use environment variables** - never commit keys to git

### ❌ DON'T

1. **Don't commit API keys** to version control
2. **Don't share keys** publicly
3. **Don't use the same key** across environments
4. **Don't disable rate limiting** without good reason
5. **Don't expose admin endpoints** without additional auth

---

## 🆙 Advanced Security (Optional)

### Option 1: JWT Tokens (More Secure)

Instead of static API keys, use JWT tokens:

1. User authenticates with username/password
2. Backend generates short-lived JWT token
3. Frontend uses token for API requests
4. Token expires after 1 hour, requires refresh

**Pros**: Much more secure, tokens expire
**Cons**: More complex setup, requires user authentication

### Option 2: Server-Side Proxy

Keep API key secret by proxying through your own server:

```
Frontend → Your Server (has API key) → Backend API
```

**Pros**: API key never exposed to client
**Cons**: Requires additional server infrastructure

### Option 3: Vercel Edge Config

Store API keys in Vercel Edge Config (ultra-fast, secure):

```bash
vercel env add EDGE_CONFIG production
```

**Pros**: Lower latency, secure storage
**Cons**: Requires Vercel Pro plan

---

## 📊 Monitoring

### Check Rate Limit Usage

Add logging to your backend:

```javascript
console.log(`[Security] IP: ${ip}, Remaining: ${security.checks.rateLimit.remaining}`)
```

View logs:

```bash
vercel logs https://backend-hiygz6v50-vumichies-projects.vercel.app --follow
```

### Track API Key Usage

Add different API keys for different clients:

```bash
API_KEYS=web-app-key-xxx,mobile-app-key-yyy,partner-api-key-zzz
```

Log which key was used:

```javascript
console.log(`[Security] Request from key: ${apiKey.substring(0, 8)}...`)
```

---

## 🆘 Troubleshooting

### Error: "API key required"

**Cause**: No API key sent in request
**Solution**: Add `X-API-Key` header to all requests

### Error: "Invalid API key"

**Cause**: API key doesn't match `API_KEYS` environment variable
**Solution**:
1. Check key in frontend `.env` matches backend
2. Verify key added to Vercel environment variables
3. Redeploy after adding env vars

### Error: "Rate limit exceeded"

**Cause**: Too many requests from same IP
**Solution**: Wait 1 minute, then retry (or increase rate limit)

### Error: "Origin not allowed"

**Cause**: Request from unauthorized domain
**Solution**: Add your domain to `ALLOWED_ORIGINS` environment variable

### CORS Errors in Browser

**Cause**: Missing or incorrect CORS headers
**Solution**:
1. Check `ALLOWED_ORIGINS` includes your frontend domain
2. Verify OPTIONS preflight request succeeds
3. Check browser console for specific CORS error

---

## 📝 Summary

Your API is now protected with:

- ✅ **API Key Authentication** - Requires valid key in `X-API-Key` header
- ✅ **Rate Limiting** - 10 requests/minute for chat, 30 for health
- ✅ **CORS Protection** - Only allowed domains can access API

**Next steps**:
1. Generate production API key
2. Add `API_KEYS` to Vercel environment variables
3. Update frontend to send API key in requests
4. Test security with and without API key
5. Monitor logs for abuse

**Your API is now secure! 🎉**

---

## 📚 Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
