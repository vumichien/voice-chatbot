# 🚀 Quick Start - Deployment

Fast deployment guide for Voice Chatbot to Vercel.

---

## Prerequisites

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login
```

---

## Option 1: Automated Deployment (Recommended)

### Windows
```bash
.\deploy.bat
```

### Linux/Mac
```bash
chmod +x deploy.sh
./deploy.sh
```

Choose:
- `1` - Backend only
- `2` - Frontend only
- `3` - Both (recommended for first deployment)

---

## Option 2: Manual Deployment

### Step 1: Deploy Backend

```bash
cd backend
vercel --prod
```

Add environment variables in [Vercel Dashboard](https://vercel.com):
- `OPENROUTER_API_KEY`
- `HUGGINGFACE_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX_NAME`

Then redeploy:
```bash
vercel --prod
```

### Step 2: Deploy Frontend

```bash
cd frontend

# Create .env file
echo VITE_API_URL=https://backend-vumichies-projects.vercel.app/api > .env

# Deploy
vercel --prod
```

### Step 3: Disable Deployment Protection

Go to: https://vercel.com/vumichies-projects/frontend/settings/deployment-protection

Select **"Standard Protection"** → Save

---

## Production URLs

**Frontend**: https://frontend-vumichies-projects.vercel.app
**Backend**: https://backend-vumichies-projects.vercel.app

---

## Testing

```bash
# Test backend
curl https://backend-vumichies-projects.vercel.app/api/health

# Test chat
curl -X POST https://backend-vumichies-projects.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"テスト"}'
```

Visit frontend and send a message!

---

## Troubleshooting

**CORS Error?**
- Check backend allows frontend domain in `backend/api/chat.js`
- Redeploy backend

**401 Error on Frontend?**
- Disable deployment protection (see Step 3 above)

**Network Error?**
- Check `frontend/.env` has correct backend URL
- Rebuild and redeploy frontend

**Full guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**Quick Commands**

```bash
# Redeploy backend
cd backend && vercel --prod

# Redeploy frontend
cd frontend && vercel --prod

# View logs
vercel logs https://backend-vumichies-projects.vercel.app

# Check deployments
vercel ls
```
