# Quick Start Guide - TTS Testing

## Prerequisites

1. **ElevenLabs API Key**: Get from https://elevenlabs.io/app/settings/api-keys
2. **Backend .env configured**: Ensure `ELEVENLABS_API_KEY` is set

## Setup Steps

### 1. Configure Backend

Add to `backend/.env`:

```bash
ELEVENLABS_API_KEY=your_actual_api_key_here
ELEVENLABS_VOICE_ID=8d0prjevDzRbEWBUu6H1
ELEVENLABS_MODEL_ID=eleven_turbo_v2_5
```

### 2. Start Backend

```bash
cd backend
npm install  # if needed
npm start    # or: node server.js
```

Expected output:
```
Server running on port 3000
```

### 3. Start Frontend

```bash
cd frontend
npm install  # if needed
npm run dev
```

Expected output:
```
Local: http://localhost:5173/
```

## Testing Checklist

### Basic Functionality

- [ ] Open http://localhost:5173/
- [ ] Send a test message (e.g., "こんにちは")
- [ ] Wait for response (text + audio)
- [ ] Verify audio icon (🔈) appears next to timestamp
- [ ] Check browser console for logs:
  ```
  [Chat] Audio generated successfully (XX.XX KB)
  [ChatContainer] Auto-playing audio for message: msg_X_XXXXX
  [AudioPlayer] Playing audio for message: msg_X_XXXXX
  ```

### Audio Controls

- [ ] **Play**: Click 🔈 icon → Should change to 🔊 (pulsing) and play audio
- [ ] **Pause**: Click 🔊 while playing → Should change to ⏸️ and pause
- [ ] **Resume**: Click ⏸️ → Should change back to 🔊 and continue playing
- [ ] **Replay**: Wait for audio to finish → Click 🔄 icon → Should replay from start

### Auto-play Toggle

- [ ] Check header shows "🔊 Auto-play ON" button
- [ ] Send a message → Audio should play automatically
- [ ] Click toggle → Should show "🔇 Auto-play OFF"
- [ ] Send another message → Audio should NOT play automatically
- [ ] Click audio icon manually → Should play
- [ ] Refresh page → Auto-play setting should persist (localStorage)

### Caching

1. **First Request**:
   - [ ] Send: "成功の秘訣は何ですか？"
   - [ ] Check console: `[TTS] Generating speech...`
   - [ ] Check console: `[Cache] Stored entry`

2. **Cached Request**:
   - [ ] Send same message again: "成功の秘訣は何ですか？"
   - [ ] Check console: `[Cache] Hit - age: X minutes`
   - [ ] Response should be much faster

### Multiple Messages

- [ ] Send 3-4 different messages
- [ ] Each should have its own audio
- [ ] Click play on old message → Should stop any current audio and play selected
- [ ] Only one audio plays at a time

### Session Management

- [ ] Play audio from a message
- [ ] Click "New Chat" or clear conversation
- [ ] Audio should stop playing
- [ ] Verify no errors in console

### Error Handling

1. **Without ElevenLabs API Key**:
   - [ ] Remove `ELEVENLABS_API_KEY` from .env
   - [ ] Restart backend
   - [ ] Send message
   - [ ] Should get text response without audio (no crash)
   - [ ] Check console: `[TTS] TTS not configured, skipping audio generation`

2. **Invalid API Key**:
   - [ ] Set wrong API key in .env
   - [ ] Send message
   - [ ] Should get text response without audio
   - [ ] Check console: `[TTS] TTS Error (continuing without audio)`

## Expected Behavior

### Response Format (Console)

```javascript
{
  response: "私は...",  // Text response
  audio: "data:audio/mpeg;base64,//uQx...",  // Base64 audio (if TTS enabled)
  sources: [...],  // RAG sources
  metadata: {
    retrievedChunks: 5,
    processingTime: 2345,
    audioGenerated: true,
    audioFromCache: false
  }
}
```

### Audio Controls States

| State | Icon | Click Action | Result |
|-------|------|--------------|--------|
| Ready | 🔈 | Play | → Playing (🔊) |
| Playing | 🔊 | Pause | → Paused (⏸️) |
| Paused | ⏸️ | Resume | → Playing (🔊) |
| Ended | 🔈 + 🔄 | Play / Replay | → Playing (🔊) |

### Performance

- **First Response**: 2-5 seconds (LLM + TTS generation)
- **Cached Response**: 1-2 seconds (LLM only, audio from cache)
- **Audio Size**: Typically 20-100 KB per response

## Troubleshooting

### No Audio Generated

1. Check `ELEVENLABS_API_KEY` is set in `backend/.env`
2. Check backend console for errors
3. Verify API key is valid at https://elevenlabs.io/
4. Check API quota hasn't been exceeded

### Audio Won't Play

1. Check browser console for errors
2. Verify audio data exists: `console.log(message.audio)`
3. Try a different browser (Chrome/Firefox recommended)
4. Check browser audio permissions

### Auto-play Not Working

1. Check toggle is ON (🔊 Auto-play ON)
2. Some browsers block auto-play on first load → Click page first
3. Check localStorage: `localStorage.getItem('audioSettings')`

### Cache Not Working

1. Check backend console for cache logs
2. Verify same exact text is being sent
3. Cache TTL is 24 hours - older entries are cleared
4. Cache is in-memory - cleared on server restart

## Testing Script

Run this test manually:

```javascript
// In browser console
// Test 1: Check settings
localStorage.getItem('audioSettings')
// Should show: {"autoPlay":true}

// Test 2: Toggle auto-play
// Click toggle button, then:
localStorage.getItem('audioSettings')
// Should show: {"autoPlay":false}

// Test 3: Check message has audio
// After receiving a response:
console.log(document.querySelector('[data-audio]'))
// Should show audio control buttons
```

## Success Criteria

✅ All messages generate audio (when API key configured)
✅ Audio controls work correctly (play/pause/resume/replay)
✅ Auto-play toggle works and persists
✅ Cache reduces response time for repeated queries
✅ Only one audio plays at a time
✅ No console errors during normal operation
✅ Graceful degradation when TTS not available

## Next Steps

Once testing is complete:

1. **Deploy to Vercel**: Backend and frontend deploy normally (base64 audio works serverless)
2. **Add to Production .env**: Don't forget to add ElevenLabs API key to Vercel env vars
3. **Monitor Usage**: Check ElevenLabs dashboard for API usage
4. **Optimize**: Review cache hit rate and adjust settings if needed

---

**Note**: The first message after starting the server will take a bit longer as the TTS service initializes. Subsequent messages will be faster, especially with caching.

