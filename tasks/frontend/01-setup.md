# Task F01: Frontend Setup

**Status**: [ ] TODO
**Estimated Time**: 2 hours
**Dependencies**: None
**Priority**: HIGH
**Location**: `frontend/`

---

## 📋 Description

Initialize the Vue 3 frontend project with Vite, Tailwind CSS, and all required dependencies for the chatbot UI.

---

## 🎯 Goals

1. Create Vue 3 + Vite project
2. Install and configure Tailwind CSS
3. Setup project folder structure
4. Configure API service layer
5. Setup Vercel deployment config
6. Create base App shell

---

## ✅ Acceptance Criteria

- [ ] Vue 3 project created with Vite
- [ ] Tailwind CSS configured and working
- [ ] Folder structure matches specification
- [ ] Can run `npm run dev` locally
- [ ] Environment variables configured
- [ ] Clean, responsive base layout

---

## 🔧 Implementation

### Step 1: Create Project

```bash
cd C:\Project\Detomo\2025\voice-chatbot
npm create vite@latest frontend -- --template vue
cd frontend
npm install
```

### Step 2: Install Dependencies

```bash
npm install axios
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: Configure Tailwind

**tailwind.config.js**:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F46E5',
        secondary: '#10B981'
      }
    },
  },
  plugins: [],
}
```

**src/style.css**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50 text-gray-900;
}
```

### Step 4: Create Folder Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ChatContainer.vue
│   │   ├── MessageList.vue
│   │   ├── MessageBubble.vue
│   │   ├── InputBox.vue
│   │   └── SourceCard.vue
│   ├── services/
│   │   └── api.js
│   ├── composables/
│   │   └── useChat.js
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── vercel.json
```

### Step 5: Create API Service

**src/services/api.js**:
```javascript
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const chatAPI = {
  async sendMessage(message, conversationId = null) {
    try {
      const response = await axios.post(`${API_BASE}/chat`, {
        message,
        conversationId,
        language: 'ja'
      })

      return response.data

    } catch (error) {
      console.error('Chat API error:', error)
      throw error
    }
  },

  async checkHealth() {
    const response = await axios.get(`${API_BASE}/health`)
    return response.data
  }
}
```

### Step 6: Create Environment File

**.env.example**:
```env
VITE_API_URL=http://localhost:3000/api
```

**.env.local** (for development):
```env
VITE_API_URL=http://localhost:3000/api
```

### Step 7: Configure Vercel

**vercel.json**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

**package.json** (add script):
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "vercel-build": "vite build"
  }
}
```

### Step 8: Create Base App

**src/App.vue**:
```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto py-4 px-4">
        <h1 class="text-2xl font-bold text-gray-900">
          AI Knowledge Chatbot
        </h1>
      </div>
    </header>

    <main class="max-w-4xl mx-auto p-4">
      <div class="bg-white rounded-lg shadow-lg p-6">
        <p class="text-gray-600 text-center">
          チャットボットを準備中...
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
// Components will be added here
</script>
```

---

## 🧪 Testing Checklist

### Installation Tests
- [ ] Run `npm install` - no errors
- [ ] Run `npm run dev` - server starts on port 5173
- [ ] Open http://localhost:5173 - app loads
- [ ] Tailwind CSS is working (styles applied)

### Configuration Tests
- [ ] Environment variables load correctly:
  ```javascript
  console.log(import.meta.env.VITE_API_URL)
  ```
- [ ] Can import API service:
  ```javascript
  import { chatAPI } from './services/api.js'
  console.log('API service loaded')
  ```

### Build Tests
- [ ] Run `npm run build` - succeeds
- [ ] Run `npm run preview` - production build works
- [ ] Check `dist/` folder created with files

---

## 📊 Expected Output

When running `npm run dev`:
```
VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Browser shows:
- Header: "AI Knowledge Chatbot"
- White card with "チャットボットを準備中..."
- Clean, responsive layout

---

## ⚠️ Common Issues

### Issue: Tailwind styles not applying
- **Solution**: Check `style.css` imported in `main.js`
- **Solution**: Restart dev server

### Issue: API_URL undefined
- **Solution**: Create `.env.local` file
- **Solution**: Restart dev server (env changes require restart)

---

## ✨ Success Criteria

Task is complete when:
1. ✅ Vue 3 + Vite project running
2. ✅ Tailwind CSS configured and working
3. ✅ Folder structure created
4. ✅ API service layer ready
5. ✅ Can build for production
6. ✅ Base App renders correctly

---

## 📌 Next Task

**Task F02: Chat Container Component** (`tasks/frontend/02-chat-container.md`)

---

**Status**: [ ] TODO
**Started**: _____
**Completed**: _____
