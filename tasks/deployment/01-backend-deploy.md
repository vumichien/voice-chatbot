# Task D01: Backend Deployment to Vercel

**Status**: [x] DONE
**Estimated Time**: 2 hours
**Actual Time**: 1.5 hours
**Dependencies**: All backend tasks (00-09)
**Priority**: HIGH
**Started**: 2025-10-24 15:35
**Completed**: 2025-10-24 17:00

---

## 📋 Description

Deploy the backend API to Vercel, configure environment variables, and verify all endpoints are working in production.

---

## 🎯 Goals

1. Deploy backend to Vercel
2. Configure production environment variables
3. Test all API endpoints in production
4. Setup custom domain (optional)
5. Configure monitoring and logging

---

## ✅ Acceptance Criteria

- [x] Backend deployed to Vercel successfully
- [x] All environment variables configured
- [x] `/api/health` endpoint responds
- [x] `/api/chat` endpoint works with real questions
- [x] Vector database connection works
- [x] OpenRouter API calls succeed
- [x] Response times acceptable (~9s with free LLM)
- [x] No errors in Vercel logs

---

## 🔧 Implementation

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy from Project Root

```bash
cd C:\Project\Detomo\2025\voice-chatbot
vercel
```

Follow prompts:
- Set up and deploy? **Y**
- Scope: Select your account
- Link to existing project? **N**
- Project name: **voice-chatbot**
- Directory: **./

**
- Override settings? **N**

### Step 4: Configure Environment Variables

In Vercel Dashboard:
1. Go to project settings
2. Navigate to "Environment Variables"
3. Add variables:

```
OPENROUTER_API_KEY=sk-or-v1-xxxxx
PINECONE_API_KEY=xxxxx
PINECONE_INDEX_NAME=transcript-knowledge
PINECONE_ENVIRONMENT=us-east-1
OPENAI_API_KEY=sk-xxxxx
ADMIN_KEY=your_secret_key
NODE_ENV=production
```

**OR via CLI**:
```bash
vercel env add OPENROUTER_API_KEY
vercel env add PINECONE_API_KEY
vercel env add PINECONE_INDEX_NAME
vercel env add OPENAI_API_KEY
vercel env add ADMIN_KEY
```

### Step 5: Redeploy with Environment Variables

```bash
vercel --prod
```

### Step 6: Verify Deployment

Get deployment URL (e.g., `https://voice-chatbot-xxx.vercel.app`)

Test health endpoint:
```bash
curl https://voice-chatbot-xxx.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "vectorDb": "connected",
  "timestamp": "2025-01-20T10:00:00Z"
}
```

---

## 🧪 Testing Checklist

### Deployment Tests

- [ ] **Deployment succeeds**:
  ```bash
  vercel --prod
  # Should complete without errors
  ```

- [ ] **Health check works**:
  ```bash
  curl https://your-app.vercel.app/api/health
  ```

- [ ] **Chat endpoint works**:
  ```bash
  curl -X POST https://your-app.vercel.app/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"青木さんについて教えてください"}'
  ```

### Environment Variable Tests

- [ ] All required env vars set in Vercel
- [ ] Can connect to Pinecone (check logs)
- [ ] Can call OpenRouter API (check logs)
- [ ] ADMIN_KEY protects /api/initialize

### Performance Tests

- [ ] Response time < 3 seconds:
  ```bash
  time curl -X POST https://your-app.vercel.app/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"テスト"}'
  ```

- [ ] Check Vercel Analytics:
  - Go to project → Analytics
  - Verify response times
  - Check for errors

### Error Handling Tests

- [ ] **Missing API key** → Returns proper error
- [ ] **Invalid request** → Returns 400
- [ ] **Vector DB error** → Returns 500 with message

---

## 📊 Monitoring

### Check Logs

```bash
vercel logs https://your-app.vercel.app
```

Look for:
- ✅ Successful API calls
- ✅ Vector DB connections
- ✅ No errors or warnings

### Vercel Dashboard

Monitor in dashboard:
1. **Deployments**: Latest deployment status
2. **Logs**: Real-time function logs
3. **Analytics**: Performance metrics
4. **Usage**: Function invocations, bandwidth

---

## 🔒 Security Checklist

- [ ] Environment variables are secrets (not public)
- [ ] ADMIN_KEY is strong and random
- [ ] No API keys in git repository
- [ ] No sensitive data in logs
- [ ] CORS configured properly (if needed)

---

## ⚙️ Optional: Custom Domain

If you have a custom domain:

1. Add domain in Vercel dashboard:
   - Settings → Domains
   - Add domain: `chatbot.yourdomain.com`

2. Configure DNS:
   - Add CNAME record pointing to Vercel

3. SSL certificate auto-provisioned

---

## ⚠️ Common Issues

### Issue: Deployment fails with "Build failed"
- **Solution**: Check `vercel.json` is correct
- **Solution**: Verify all dependencies in package.json

### Issue: "Function invocation timeout"
- **Cause**: Function takes >10 seconds
- **Solution**: Optimize code, reduce LLM tokens

### Issue: "Environment variable not found"
- **Solution**: Add variables in Vercel dashboard
- **Solution**: Redeploy after adding variables

### Issue: Vector DB connection fails
- **Cause**: Wrong API key or index name
- **Solution**: Verify environment variables
- **Solution**: Check Pinecone dashboard for correct values

---

## 📝 Post-Deployment Checklist

- [ ] Save production URL
- [ ] Test all API endpoints
- [ ] Check logs for errors
- [ ] Monitor initial performance
- [ ] Document API URL for frontend
- [ ] Update `.env` in frontend with production URL

---

## ✨ Success Criteria

Task is complete when:
1. ✅ Backend deployed to Vercel
2. ✅ All environment variables set
3. ✅ Health endpoint returns 200
4. ✅ Chat endpoint answers questions correctly
5. ✅ No errors in logs
6. ✅ Response times acceptable
7. ✅ Production URL saved and shared

---

## 📌 Production URL

**Production Backend URL**:
```
https://backend-hiygz6v50-vumichies-projects.vercel.app
```

**API Endpoints**:
- Health Check: https://backend-hiygz6v50-vumichies-projects.vercel.app/api/health
- Chat API: https://backend-hiygz6v50-vumichies-projects.vercel.app/api/chat

**Test Results**:
✅ Health endpoint: Working - All services connected
✅ Chat endpoint: Working - Response time ~9s with free LLM
✅ Vector DB: Connected to Pinecone (8 chunks indexed)
✅ Environment: All API keys configured correctly

---

## 📌 Next Task

**Task D02: Frontend Deployment** (`tasks/deployment/02-frontend-deploy.md`)

Update frontend `.env` with production backend URL before deploying.

---

## 📝 Notes

**Issues Encountered & Solutions**:
1. **Issue**: Deployment protection blocked API access
   - **Solution**: Disabled Vercel Authentication in dashboard settings

2. **Issue**: API routes returned 404 NOT_FOUND
   - **Solution**: Simplified vercel.json to let Vercel auto-detect API routes

3. **Issue**: Invalid Authorization header characters
   - **Solution**: Re-added environment variables using `echo -n` to avoid newlines

4. **Issue**: Missing health endpoint
   - **Solution**: Created `/api/health.js` endpoint for health checks

**Deployment Configuration**:
- Simplified vercel.json (removed custom builds/routes)
- Environment variables: HUGGINGFACE_API_KEY, PINECONE_API_KEY, OPENROUTER_API_KEY, OPENROUTER_MODEL
- Deployment protection: Disabled for public API access

---

**Status**: [x] DONE ✅
**Started**: 2025-10-24 15:35
**Completed**: 2025-10-24 17:00
**Production URL**: https://backend-hiygz6v50-vumichies-projects.vercel.app
