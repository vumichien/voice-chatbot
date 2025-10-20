# 🚀 Quick Start - Run & Test API in 3 Steps

## Step 1️⃣: Open First Terminal - Start Server

```bash
cd backend
npm start
```

**Wait for this message:**
```
🚀 Server running on http://localhost:3000
✅ Ready to accept requests!
```

✅ **Keep this terminal OPEN!**

---

## Step 2️⃣: Open Second Terminal - Run Tests

**Open a NEW terminal window**, then run:

```bash
cd backend
npm run test:api
```

**You should see:**
```
🧪 Live API Test Suite
Testing server at: http://localhost:3000

✅ Health check passed
✅ Request successful
✅ All tests complete!
```

---

## Step 3️⃣: Test Manually (Optional)

### Quick Test with curl:

```bash
curl -X POST http://localhost:3000/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"黄金率とは何ですか？\"}"
```

**Note**: On Windows PowerShell, use `"` instead of `'`

---

## ✅ If Everything Works

You should see:
1. ✅ Server running on port 3000
2. ✅ Health check passes
3. ✅ Chat API returns Japanese answers
4. ✅ Sources with timestamps included

---

## ❌ If Something Goes Wrong

### Problem: "Port 3000 already in use"
**Solution**: Use a different port:
```bash
# Windows PowerShell
$env:PORT=3001; npm start

# Windows CMD
set PORT=3001 && npm start

# Git Bash
PORT=3001 npm start
```

### Problem: "OPENROUTER_API_KEY not set"
**Solution**: Check `.env` file has this line:
```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-key
```

### Problem: "No relevant information found"
**Solution**: Populate database first:
```bash
node scripts/test-pipeline.js
```

---

## 📖 For More Details

See **API_TESTING_GUIDE.md** for:
- Full testing methods
- Troubleshooting guide
- Sample questions
- Response format explanation

---

**That's it! Your API is ready! 🎉**
