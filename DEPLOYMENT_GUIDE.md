# 🚀 Voice Chatbot - Complete Deployment Guide

This guide covers the complete deployment process for both **Frontend** and **Backend** to Vercel.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Overview](#overview)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Production URLs](#production-urls)

---

## Prerequisites

### Required Tools
- [Node.js](https://nodejs.org/) v18+ installed
- [Vercel CLI](https://vercel.com/download) installed globally
- Git repository initialized
- Vercel account created

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Required API Keys
Before deployment, ensure you have:
- ✅ **OPENROUTER_API_KEY** - For LLM responses
- ✅ **HUGGINGFACE_API_KEY** - For embeddings
- ✅ **PINECONE_API_KEY** - For vector database
- ✅ **PINECONE_INDEX_NAME** - Your Pinecone index name

---

## Overview

### Architecture
```
┌─────────────────────────────────────────────────┐
│  Frontend (Vue.js + Vite)                       │
│  https://frontend-vumichies-projects.vercel.app │
└────────────────┬────────────────────────────────┘
                 │ HTTPS API Calls
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend (Node.js + Express)                    │
│  https://backend-vumichies-projects.vercel.app  │
└────────────────┬────────────────────────────────┘
                 │
    ┌────────────┴────────────┬──────────────┐
    ▼                         ▼              ▼
┌─────────┐            ┌──────────┐    ┌─────────┐
│ Pinecone│            │OpenRouter│    │Hugging  │
│ Vector  │            │   LLM    │    │  Face   │
│   DB    │            │   API    │    │Embedding│
└─────────┘            └──────────┘    └─────────┘
```

### Deployment Strategy
1. **Backend First** - Deploy API endpoints and configure environment variables
2. **Frontend Second** - Deploy UI and point to backend API
3. **Test** - Verify end-to-end functionality

---

## Backend Deployment

### Step 1: Prepare Backend

Navigate to backend directory:
```bash
cd backend
```

Verify `vercel.json` configuration exists:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ]
}
```

### Step 2: Deploy Backend

Deploy to Vercel (first time):
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Y
- **Which scope?** → Select your account
- **Link to existing project?** → N
- **Project name?** → backend
- **Directory?** → `./` (current directory)
- **Override settings?** → N

For production deployment:
```bash
vercel --prod
```

### Step 3: Configure Environment Variables

You can add environment variables via:

**Option A: Vercel Dashboard**
1. Go to: https://vercel.com/vumichies-projects/backend/settings/environment-variables
2. Add the following variables (one by one):

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `OPENROUTER_API_KEY` | `sk-or-v1-xxxxx...` | Production, Preview, Development |
| `OPENROUTER_MODEL` | `google/gemini-2.0-flash-exp:free` | Production, Preview, Development |
| `HUGGINGFACE_API_KEY` | `hf_xxxxx...` | Production, Preview, Development |
| `PINECONE_API_KEY` | `xxxxx...` | Production, Preview, Development |
| `PINECONE_INDEX_NAME` | `transcript-knowledge` | Production, Preview, Development |
| `EMBEDDING_PROVIDER` | `huggingface` | Production, Preview, Development |
| `EMBEDDING_MODEL` | `multilingual-e5-base` | Production, Preview, Development |
| `VECTORDB_PROVIDER` | `pinecone` | Production, Preview, Development |

**Option B: Vercel CLI**
```bash
# Add environment variables via CLI
vercel env add OPENROUTER_API_KEY
# Paste your key when prompted

vercel env add HUGGINGFACE_API_KEY
# Paste your key when prompted

vercel env add PINECONE_API_KEY
# Paste your key when prompted

vercel env add PINECONE_INDEX_NAME
# Enter: transcript-knowledge

vercel env add OPENROUTER_MODEL
# Enter: google/gemini-2.0-flash-exp:free
```

### Step 4: Redeploy with Environment Variables

After adding environment variables, redeploy:
```bash
vercel --prod
```

### Step 5: Get Backend URL

After deployment completes, Vercel provides URLs:
```
Production: https://backend-xxxxx.vercel.app
```

The **stable production URL** is:
```
https://backend-vumichies-projects.vercel.app
```

**Save this URL** - you'll need it for frontend configuration.

### Step 6: Verify Backend Deployment

Test the health endpoint:
```bash
curl https://backend-vumichies-projects.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-24T12:00:00.000Z",
  "environment": {
    "hasOpenRouter": true,
    "hasHuggingFace": true,
    "hasPinecone": true
  },
  "vectorDb": "connected"
}
```

Test the chat endpoint:
```bash
curl -X POST https://backend-vumichies-projects.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"テスト"}'
```

Should return a JSON response with `response` and `sources` fields.

---

## Frontend Deployment

### Step 1: Configure Frontend

Navigate to frontend directory:
```bash
cd frontend
```

### Step 2: Create Environment File

Create `.env` file with backend API URL:
```bash
echo VITE_API_URL=https://backend-vumichies-projects.vercel.app/api > .env
```

Or manually create `frontend/.env`:
```env
VITE_API_URL=https://backend-vumichies-projects.vercel.app/api
```

### Step 3: Build Frontend Locally (Test)

Test the build works:
```bash
npm run build
```

Expected output:
```
✓ built in 1.29s
dist/index.html                   0.47 kB
dist/assets/index-CaUDcAfQ.css   16.22 kB
dist/assets/index-CLv9bAiw.js   120.93 kB
```

### Step 4: Deploy Frontend

Deploy to Vercel:
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Y
- **Which scope?** → Select your account
- **Link to existing project?** → N
- **Project name?** → frontend
- **Directory?** → `./` (current directory)
- **Override settings?** → N

For production deployment:
```bash
vercel --prod
```

### Step 5: Get Frontend URL

After deployment, the **stable production URL** is:
```
https://frontend-vumichies-projects.vercel.app
```

### Step 6: Disable Deployment Protection

By default, Vercel enables deployment protection. To make your app publicly accessible:

1. Go to: https://vercel.com/vumichies-projects/frontend/settings/deployment-protection
2. Select **"Standard Protection"** (allows public access)
3. Click **Save**

### Step 7: Verify Frontend Deployment

1. Visit: https://frontend-vumichies-projects.vercel.app
2. You should see the chat interface
3. Try sending a message in Japanese
4. Verify you receive a response

---

## Configuration

### Backend CORS Configuration

The backend is configured to accept requests from:
- `https://frontend-vumichies-projects.vercel.app` (production)
- `http://localhost:5173` (local development)
- `http://localhost:3000` (local development)

**Location**: `backend/api/chat.js` and `backend/api/health.js`

```javascript
const allowedOrigins = [
  'https://frontend-vumichies-projects.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
]
```

### Backend Security Settings

**API Key**: Disabled for public chatbot access
**Rate Limiting**: Enabled (10 requests/minute per IP)

**Location**: `backend/api/chat.js:36`

```javascript
const security = securityMiddleware(req, {
  requireApiKey: false,  // Public chatbot
  enableRateLimit: true,
  rateLimitOptions: {
    windowMs: 60000,   // 1 minute
    maxRequests: 10     // 10 requests per minute
  }
})
```

### Frontend API Configuration

The frontend reads the backend URL from environment variables.

**Location**: `frontend/src/services/api.js`

```javascript
const API_BASE = import.meta.env.VITE_API_URL || '/api'
```

**Build-time environment**: `frontend/.env`

```env
VITE_API_URL=https://backend-vumichies-projects.vercel.app/api
```

---

## Testing

### Backend Tests

**1. Health Check**
```bash
curl https://backend-vumichies-projects.vercel.app/api/health
```

Expected: `{"status":"ok", ...}`

**2. Chat Endpoint**
```bash
curl -X POST https://backend-vumichies-projects.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"青木さんについて教えてください"}'
```

Expected: JSON with `response` and `sources` fields

**3. CORS Headers**
```bash
curl -X OPTIONS https://backend-vumichies-projects.vercel.app/api/chat \
  -H "Origin: https://frontend-vumichies-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Expected: `access-control-allow-origin` header present

### Frontend Tests

**1. Page Load**
- Visit: https://frontend-vumichies-projects.vercel.app
- Verify: Chat interface loads
- Check: No console errors

**2. Send Message**
- Type: "テスト"
- Click: Send button
- Verify: Message appears in chat
- Verify: Response received (~9 seconds)
- Verify: Sources displayed

**3. Conversation History**
- Send multiple messages
- Verify: Context maintained
- Click: "Clear conversation"
- Verify: Confirmation modal appears
- Confirm: Conversation cleared

**4. Error Handling**
- Send empty message → Should show error
- Disconnect internet → Should show error message

---

## Troubleshooting

### Backend Issues

#### Issue: "API configuration error"
**Cause**: Missing environment variables

**Solution**:
```bash
# Check environment variables in Vercel dashboard
# Or list them via CLI:
vercel env ls

# Add missing variables:
vercel env add OPENROUTER_API_KEY
vercel env add PINECONE_API_KEY

# Redeploy:
vercel --prod
```

#### Issue: "Vector DB connection failed"
**Cause**: Wrong Pinecone API key or index name

**Solution**:
1. Verify API key at: https://app.pinecone.io/
2. Verify index name matches environment variable
3. Update in Vercel dashboard
4. Redeploy backend

#### Issue: "Function invocation timeout"
**Cause**: Request takes >10 seconds (Vercel limit)

**Solution**:
- Use faster LLM model (current: `google/gemini-2.0-flash-exp:free`)
- Reduce `topK` in vector search (current: 5)
- Reduce `max_tokens` in LLM call (current: 500)

#### Issue: CORS errors in browser console
**Cause**: Frontend domain not in allowed origins

**Solution**:
1. Check `backend/api/chat.js` allowed origins
2. Add your frontend domain
3. Redeploy backend: `vercel --prod`

### Frontend Issues

#### Issue: "Network Error" when sending messages
**Cause**: Wrong backend URL in `.env`

**Solution**:
```bash
# Update frontend/.env
echo VITE_API_URL=https://backend-vumichies-projects.vercel.app/api > .env

# Rebuild
npm run build

# Redeploy
vercel --prod
```

#### Issue: 401 Unauthorized when accessing frontend
**Cause**: Deployment protection enabled

**Solution**:
1. Go to: https://vercel.com/vumichies-projects/frontend/settings/deployment-protection
2. Select "Standard Protection"
3. Save changes

#### Issue: Frontend shows old version after deployment
**Cause**: Browser cache

**Solution**:
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Try incognito/private window

#### Issue: Build fails with "Module not found"
**Cause**: Missing dependencies

**Solution**:
```bash
# Install dependencies
npm install

# Rebuild
npm run build
```

---

## Production URLs

### Stable URLs (Don't Change)

**Frontend**:
```
https://frontend-vumichies-projects.vercel.app
```

**Backend**:
```
https://backend-vumichies-projects.vercel.app
```

### API Endpoints

**Health Check**:
```
GET https://backend-vumichies-projects.vercel.app/api/health
```

**Chat**:
```
POST https://backend-vumichies-projects.vercel.app/api/chat
Content-Type: application/json

{
  "message": "Your question in Japanese",
  "conversationId": "optional-conversation-id",
  "conversationHistory": []
}
```

---

## Deployment Checklist

### Backend Deployment ✓

- [ ] Navigate to `backend/` directory
- [ ] Run `vercel` (first time) or `vercel --prod`
- [ ] Add environment variables in Vercel dashboard:
  - [ ] OPENROUTER_API_KEY
  - [ ] HUGGINGFACE_API_KEY
  - [ ] PINECONE_API_KEY
  - [ ] PINECONE_INDEX_NAME
  - [ ] OPENROUTER_MODEL
- [ ] Redeploy after adding env vars: `vercel --prod`
- [ ] Test health endpoint: `curl .../api/health`
- [ ] Test chat endpoint: `curl -X POST .../api/chat`
- [ ] Verify CORS headers present
- [ ] Save backend URL for frontend

### Frontend Deployment ✓

- [ ] Navigate to `frontend/` directory
- [ ] Create `.env` with `VITE_API_URL=https://backend-vumichies-projects.vercel.app/api`
- [ ] Test build locally: `npm run build`
- [ ] Run `vercel` (first time) or `vercel --prod`
- [ ] Disable deployment protection in Vercel dashboard
- [ ] Visit frontend URL
- [ ] Test sending a message
- [ ] Verify response received
- [ ] Check sources displayed
- [ ] Test conversation history
- [ ] Verify no console errors

### Post-Deployment ✓

- [ ] Both apps accessible publicly
- [ ] No 401/403 errors
- [ ] Chat works end-to-end
- [ ] Japanese text displays correctly
- [ ] Response time acceptable (~9 seconds)
- [ ] Sources citation working
- [ ] Clear conversation works
- [ ] No errors in Vercel logs

---

## Updating After Changes

### Update Backend

```bash
cd backend

# Make your code changes...

# Deploy
vercel --prod
```

**Note**: No need to update frontend if API contract doesn't change.

### Update Frontend

```bash
cd frontend

# Make your code changes...

# Build locally to test
npm run build

# Deploy
vercel --prod
```

**Note**: If backend URL changed, update `frontend/.env` first.

### Update Environment Variables

**Via Dashboard**:
1. Go to project settings
2. Navigate to Environment Variables
3. Edit or add variables
4. Redeploy the project

**Via CLI**:
```bash
# Remove old variable
vercel env rm VARIABLE_NAME

# Add new variable
vercel env add VARIABLE_NAME

# Redeploy
vercel --prod
```

---

## Best Practices

### Security
1. ✅ Never commit `.env` files to git
2. ✅ Keep API keys in Vercel environment variables
3. ✅ Use rate limiting (already configured)
4. ✅ Validate all inputs (already implemented)

### Performance
1. ✅ Use free LLM tiers for testing
2. ✅ Monitor Vercel usage dashboard
3. ✅ Optimize images and assets
4. ✅ Enable caching where appropriate

### Monitoring
1. ✅ Check Vercel logs regularly
2. ✅ Monitor error rates
3. ✅ Track response times
4. ✅ Set up alerts for failures

### Development Workflow
1. Test locally first
2. Deploy to preview (without `--prod`)
3. Test preview deployment
4. Deploy to production (`--prod`)

---

## Quick Reference Commands

```bash
# Backend deployment
cd backend
vercel --prod

# Frontend deployment
cd frontend
vercel --prod

# View logs
vercel logs https://backend-vumichies-projects.vercel.app

# List deployments
vercel ls

# Environment variables
vercel env ls
vercel env add VARIABLE_NAME
vercel env rm VARIABLE_NAME

# Rollback to previous deployment
vercel rollback

# Open project in dashboard
vercel
```

---

## Support & Resources

- **Vercel Documentation**: https://vercel.com/docs
- **Vercel CLI Reference**: https://vercel.com/docs/cli
- **Project Dashboard**: https://vercel.com/vumichies-projects

---

**Last Updated**: 2025-10-24
**Deployment Version**: v1.0
**Status**: ✅ Production Ready

---

## Summary

Your Voice Chatbot is now deployed! 🎉

**Frontend**: https://frontend-vumichies-projects.vercel.app
**Backend**: https://backend-vumichies-projects.vercel.app

**Response Time**: ~9 seconds (using free LLM tier)
**Uptime**: 99.9% (Vercel SLA)
**Cost**: Free tier (current usage)

For issues or questions, check the [Troubleshooting](#troubleshooting) section.
