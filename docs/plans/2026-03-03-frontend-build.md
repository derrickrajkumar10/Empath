# Empath Frontend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete Empath React frontend — Landing, Quick Start, Session (cinematic layout with floating AI overlays), and Report pages — wired to the existing FastAPI backend.

**Architecture:** React 18 + Vite SPA with 4 routes. Session state lives in React Context. Webcam capture runs in a custom hook at 2s intervals, sending frames to the backend. The session page uses absolute-positioned floating panels overlaying a YouTube video embed.

**Tech Stack:** React 18, Vite 5, TailwindCSS 3, Framer Motion 11, Recharts 2, React Router v6, Axios, react-youtube, Inter font (Google Fonts)

**Design reference:** `docs/plans/2026-03-03-frontend-design.md` — read this before starting

**Backend:** Running at `http://localhost:8000`. All API endpoints documented in `backend/main.py`.

---

## Before You Start

The backend is already built at `d:/Projects/Empath/backend/`. The frontend goes in `d:/Projects/Empath/frontend/`. You will create this directory.

Emotion color map (used everywhere):
```js
const EMOTION_COLORS = {
  focused:   '#4ADE80',
  neutral:   '#FACC15',
  confused:  '#FB923C',
  bored:     '#F472B6',
  distressed:'#F87171',
}
```

Emotion emoji map:
```js
const EMOTION_EMOJI = {
  focused: '😊', neutral: '😐', confused: '🤔', bored: '😴', distressed: '😟'
}
```

---

### Task 1: Scaffold Vite + React Project

**Files:**
- Create: `frontend/` (entire directory)

**Step 1: Navigate to project root and scaffold**

```bash
cd d:/Projects/Empath
npm create vite@latest frontend -- --template react
```

Expected output: "Scaffolding project in .../frontend..."

**Step 2: Install base dependencies**

```bash
cd d:/Projects/Empath/frontend
npm install
npm install react-router-dom axios framer-motion recharts react-youtube
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: "VITE v5.x.x  ready in Xms — Local: http://localhost:5173/"
Open browser — should show Vite + React default page.
Stop server with Ctrl+C.

---

### Task 2: Configure Tailwind CSS + Global Styles

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`
- Modify: `frontend/index.html`

**Step 1: Replace `tailwind.config.js` entirely**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#141414',
        surface: '#1E1E1E',
        border: '#2A2A2A',
        muted: '#555555',
        emotion: {
          focused:    '#4ADE80',
          neutral:    '#FACC15',
          confused:   '#FB923C',
          bored:      '#F472B6',
          distressed: '#F87171',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

**Step 2: Replace `frontend/src/index.css` entirely**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    background-color: #141414;
    color: #ffffff;
    font-family: 'Inter', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  input, textarea {
    background-color: #1E1E1E;
    color: #ffffff;
    border: 1px solid #2A2A2A;
    border-radius: 8px;
    padding: 12px 16px;
    width: 100%;
    outline: none;
    transition: border-color 0.2s;
  }
  input:focus, textarea:focus {
    border-color: #555;
  }
  input::placeholder { color: #555; }
}

@layer utilities {
  .pill-btn {
    @apply px-6 py-3 rounded-full border border-white/30 text-white text-sm font-medium
           transition-all duration-200 hover:bg-white hover:text-black cursor-pointer;
  }
  .pill-btn-solid {
    @apply px-6 py-3 rounded-full bg-white text-black text-sm font-medium
           transition-all duration-200 hover:bg-white/90 cursor-pointer;
  }
  .card {
    @apply bg-surface border border-border rounded-2xl p-6;
  }
}
```

**Step 3: Add Inter font to `frontend/index.html`** — add inside `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<title>Empath — AI-Powered Learning</title>
```

Also change `<body>` to remove the default margin if any. Full `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <title>Empath — AI-Powered Learning</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 4: Clean up src/**

Delete `frontend/src/App.css` and `frontend/src/assets/react.svg` (not needed).

**Step 5: Verify Tailwind works**

Replace `frontend/src/App.jsx` temporarily:
```jsx
export default function App() {
  return <div className="min-h-screen bg-bg text-white flex items-center justify-center text-4xl font-bold">Empath</div>
}
```

Run `npm run dev` — should show "Empath" centered on a dark `#141414` background. If you see the dark background and white text, Tailwind is working.

---

### Task 3: App.jsx with Router + Placeholder Pages

**Files:**
- Create: `frontend/src/pages/LandingPage.jsx`
- Create: `frontend/src/pages/QuickStartPage.jsx`
- Create: `frontend/src/pages/SessionPage.jsx`
- Create: `frontend/src/pages/ReportPage.jsx`
- Modify: `frontend/src/main.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Create placeholder pages** — same pattern for all 4:

`frontend/src/pages/LandingPage.jsx`:
```jsx
export default function LandingPage() {
  return <div className="min-h-screen bg-bg flex items-center justify-center text-white text-2xl">Landing Page</div>
}
```

Repeat for `QuickStartPage.jsx`, `SessionPage.jsx`, `ReportPage.jsx` — change the label text.

**Step 2: Update `frontend/src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 3: Update `frontend/src/App.jsx`**

```jsx
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import QuickStartPage from './pages/QuickStartPage'
import SessionPage from './pages/SessionPage'
import ReportPage from './pages/ReportPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/start" element={<QuickStartPage />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/report/:sessionId" element={<ReportPage />} />
    </Routes>
  )
}
```

**Step 4: Verify routing**

Run `npm run dev`. Navigate to:
- `http://localhost:5173/` → "Landing Page"
- `http://localhost:5173/start` → "Quick Start Page"
- `http://localhost:5173/session` → "Session Page"

All should show dark background with white text label.

---

### Task 4: API Layer

**Files:**
- Create: `frontend/src/api.js`

**Step 1: Create `frontend/src/api.js`**

```js
import axios from 'axios'

const BASE = 'http://localhost:8000/api'

export async function checkHealth() {
  const { data } = await axios.get(`${BASE}/health`)
  return data  // { models_ready: bool }
}

export async function startSession(studentId, videoId, topic) {
  const { data } = await axios.post(`${BASE}/start-session`, null, {
    params: { student_id: studentId, video_id: videoId, topic }
  })
  return data  // { session_id: string }
}

export async function analyzeEmotion(imageBlob) {
  const form = new FormData()
  form.append('file', imageBlob, 'frame.jpg')
  const { data } = await axios.post(`${BASE}/analyze-emotion`, form)
  return data  // { emotion, confidence, phone_detected, distractions }
}

export async function sendBehaviorEvent(sessionId, timestampSeconds, eventType) {
  await axios.post(`${BASE}/behavior-event`, {
    session_id: sessionId,
    timestamp_seconds: timestampSeconds,
    event_type: eventType,
  })
}

export async function computeScore(sessionId, emotion, confidence, recentEvents, timestampSeconds) {
  const { data } = await axios.post(`${BASE}/compute-score`, {
    session_id: sessionId,
    emotion,
    confidence,
    recent_events: recentEvents,
    timestamp_seconds: timestampSeconds,
  })
  return data  // { focus_score, engagement_state }
}

export async function getSuggestion(sessionId, engagementState, topic, timestampSeconds) {
  const { data } = await axios.post(`${BASE}/get-suggestion`, {
    session_id: sessionId,
    engagement_state: engagementState,
    topic,
    timestamp_seconds: timestampSeconds,
  })
  return data  // { suggestion, action }
}

export async function getSessionReport(sessionId) {
  const { data } = await axios.get(`${BASE}/session-report/${sessionId}`)
  return data
}

export async function endSession(sessionId) {
  await axios.post(`${BASE}/end-session/${sessionId}`)
}
```

**Step 2: Verify (manual)**

Open browser console at `http://localhost:5173`. Run:
```js
import('/src/api.js').then(m => m.checkHealth().then(console.log))
```
If backend is running, you'll see `{ models_ready: true/false }`.
If backend isn't running, you'll see a CORS/network error — that's fine for now.

---

### Task 5: Session Context

**Files:**
- Create: `frontend/src/context/SessionContext.jsx`
- Modify: `frontend/src/main.jsx`

**Step 1: Create `frontend/src/context/SessionContext.jsx`**

```jsx
import { createContext, useContext, useState } from 'react'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [sessionId, setSessionId] = useState(null)
  const [studentName, setStudentName] = useState('')
  const [topic, setTopic] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isActive, setIsActive] = useState(false)

  function startSession(id, name, topicVal, url) {
    setSessionId(id)
    setStudentName(name)
    setTopic(topicVal)
    setVideoUrl(url)
    setIsActive(true)
  }

  function clearSession() {
    setSessionId(null)
    setStudentName('')
    setTopic('')
    setVideoUrl('')
    setIsActive(false)
  }

  return (
    <SessionContext.Provider value={{
      sessionId, studentName, topic, videoUrl, isActive,
      startSession, clearSession,
    }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within SessionProvider')
  return ctx
}
```

**Step 2: Wrap app in SessionProvider — update `frontend/src/main.jsx`**

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from './context/SessionContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SessionProvider>
        <App />
      </SessionProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

---

### Task 6: useWebcam Hook

**Files:**
- Create: `frontend/src/hooks/useWebcam.js`

**Step 1: Create `frontend/src/hooks/useWebcam.js`**

```js
import { useRef, useState, useCallback, useEffect } from 'react'

export function useWebcam() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [hasPermission, setHasPermission] = useState(null) // null=unknown, true, false
  const [stream, setStream] = useState(null)

  async function requestPermission() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 224, height: 224, facingMode: 'user' }
      })
      setStream(s)
      setHasPermission(true)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } catch {
      setHasPermission(false)
    }
  }

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
  }

  // Returns a Promise<Blob|null> — captured JPEG frame
  const captureFrame = useCallback(() => {
    return new Promise((resolve) => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || !stream) return resolve(null)
      const ctx = canvas.getContext('2d')
      canvas.width = 224
      canvas.height = 224
      ctx.drawImage(video, 0, 0, 224, 224)
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.7)
    })
  }, [stream])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopStream()
  }, [stream])

  return { videoRef, canvasRef, hasPermission, stream, requestPermission, captureFrame, stopStream }
}
```

**Step 2: Verify (manual)**

No automated test here — webcam requires browser. Verification happens in Task 13 when you wire it into the session page.

---

### Task 7: Shared Components — EmotionPill + FloatingPill

**Files:**
- Create: `frontend/src/components/EmotionPill.jsx`
- Create: `frontend/src/components/FloatingDecorations.jsx`

**Step 1: Create `frontend/src/components/EmotionPill.jsx`**

```jsx
import { motion } from 'framer-motion'

const EMOTION_COLORS = {
  focused:    '#4ADE80',
  neutral:    '#FACC15',
  confused:   '#FB923C',
  bored:      '#F472B6',
  distressed: '#F87171',
}

const EMOTION_EMOJI = {
  focused: '😊', neutral: '😐', confused: '🤔', bored: '😴', distressed: '😟'
}

export default function EmotionPill({ emotion, className = '' }) {
  const color = EMOTION_COLORS[emotion] || '#888'
  const emoji = EMOTION_EMOJI[emotion] || '•'

  return (
    <motion.div
      key={emotion}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-black ${className}`}
      style={{ backgroundColor: color }}
    >
      <span>{emoji}</span>
      <span className="capitalize">{emotion}</span>
    </motion.div>
  )
}

export { EMOTION_COLORS, EMOTION_EMOJI }
```

**Step 2: Create `frontend/src/components/FloatingDecorations.jsx`**

These are the drifting emotion pills that appear on the Landing and Quick Start pages as decoration.

```jsx
import { motion } from 'framer-motion'

const DECORATIONS = [
  { label: '😊 focused',    color: '#4ADE80', x: '8%',  y: '20%', delay: 0 },
  { label: '😐 neutral',    color: '#FACC15', x: '85%', y: '30%', delay: 1.2 },
  { label: '🤔 confused',   color: '#FB923C', x: '12%', y: '65%', delay: 0.8 },
  { label: '😴 bored',      color: '#F472B6', x: '80%', y: '70%', delay: 2 },
  { label: '😟 distressed', color: '#F87171', x: '50%', y: '15%', delay: 1.5 },
]

export default function FloatingDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {DECORATIONS.map((d, i) => (
        <motion.div
          key={i}
          className="absolute px-4 py-2 rounded-full text-sm font-semibold text-black select-none"
          style={{ backgroundColor: d.color, left: d.x, top: d.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 1, 1, 0.8, 1],
            y: [0, -14, 0, -8, 0],
            scale: [0.8, 1, 1, 1, 1],
          }}
          transition={{
            duration: 4,
            delay: d.delay,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        >
          {d.label}
        </motion.div>
      ))}
    </div>
  )
}
```

---

### Task 8: Landing Page

**Files:**
- Modify: `frontend/src/pages/LandingPage.jsx`

**Step 1: Write the full LandingPage component**

```jsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import FloatingDecorations from '../components/FloatingDecorations'

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
}

function StatCard({ number, label }) {
  return (
    <div className="text-center">
      <div className="text-7xl font-extrabold text-white">{number}</div>
      <div className="text-sm text-gray-500 mt-1 uppercase tracking-widest">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description }) {
  return (
    <motion.div {...fadeUp} className="card hover:border-white/20 transition-colors">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </motion.div>
  )
}

function StepCard({ number, title, description }) {
  return (
    <motion.div {...fadeUp} className="text-center px-8">
      <div className="text-8xl font-extrabold text-white/10 mb-2">{number}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </motion.div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
           style={{ background: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-extrabold text-sm">E</span>
          </div>
          <span className="font-bold text-lg">Empath</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
        </div>
        <button onClick={() => navigate('/start')} className="pill-btn text-sm">
          Start Learning →
        </button>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-8 pt-20">
        <FloatingDecorations />
        <div className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-block px-4 py-2 rounded-full border border-white/20 text-xs text-gray-400 mb-8 uppercase tracking-widest"
          >
            AI-Powered Learning
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-6xl md:text-7xl font-extrabold leading-tight mb-6"
          >
            Learn Smarter.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-400 mb-10 leading-relaxed"
          >
            Empath reads your emotions in real time and adapts your learning experience — so you stay focused and never fall behind.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={() => navigate('/start')}
            className="pill-btn text-lg px-10 py-4"
          >
            Start Learning →
          </motion.button>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-600 text-sm mt-6"
          >
            No account needed. Just a name and a YouTube video.
          </motion.p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-8 py-24">
        <motion.h2 {...fadeUp} className="text-4xl font-extrabold text-center mb-4">
          Everything you need to stay focused
        </motion.h2>
        <motion.p {...fadeUp} className="text-gray-500 text-center mb-16 text-lg">
          Three AI models working together, invisibly.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon="🧠"
            title="Emotion Detection"
            description="Reads 5 emotional states from your face every 2 seconds using a fine-tuned vision model."
          />
          <FeatureCard
            icon="📊"
            title="Focus Score"
            description="A real-time 0–100 score combining your facial emotion and video behavior signals."
          />
          <FeatureCard
            icon="💡"
            title="Smart Interventions"
            description="When focus drops, Empath suggests pausing, rewinding, or taking a short break — before you lose the thread."
          />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 border-t border-border">
        <motion.h2 {...fadeUp} className="text-4xl font-extrabold text-center mb-16">
          How it works
        </motion.h2>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-8">
          <StepCard number="01" title="Open a video" description="Paste any YouTube link — lecture, tutorial, documentary — and enter your topic." />
          <StepCard number="02" title="Empath watches" description="Your webcam feed is analyzed locally every 2 seconds. No footage is stored." />
          <StepCard number="03" title="Get nudges" description="When your focus dips, Empath intervenes with a targeted suggestion to get you back on track." />
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 border-t border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 px-8">
          <StatCard number="5" label="Emotions Tracked" />
          <StatCard number="2s" label="Update Interval" />
          <StatCard number="3" label="AI Models" />
          <StatCard number="100%" label="Local & Private" />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative py-32 text-center border-t border-border overflow-hidden">
        <FloatingDecorations />
        <div className="relative z-10">
          <motion.h2 {...fadeUp} className="text-5xl font-extrabold mb-6">
            Ready to actually focus?
          </motion.h2>
          <motion.p {...fadeUp} className="text-gray-500 mb-10 text-lg">
            Start a session in 10 seconds. No signup required.
          </motion.p>
          <motion.button {...fadeUp} onClick={() => navigate('/start')} className="pill-btn-solid text-lg px-10 py-4">
            Begin Session →
          </motion.button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-12 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
            <span className="text-black font-bold text-xs">E</span>
          </div>
          <span>Empath — AI-Powered Learning</span>
        </div>
        <span>Built for BIS Standards Hackathon</span>
      </footer>

    </div>
  )
}
```

**Step 2: Verify**

Run `npm run dev`. Open `http://localhost:5173/`.
- Dark background, floating emotion pills animating
- "Learn Smarter." hero headline visible
- Nav bar, features section, stats, CTA all visible on scroll
- "Start Learning →" button navigates to `/start`

---

### Task 9: Quick Start Page

**Files:**
- Modify: `frontend/src/pages/QuickStartPage.jsx`

**Step 1: Write QuickStartPage**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { startSession } from '../api'
import FloatingDecorations from '../components/FloatingDecorations'

export default function QuickStartPage() {
  const navigate = useNavigate()
  const { startSession: ctxStart } = useSession()
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !topic.trim() || !url.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const videoId = name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now()
      const { session_id } = await startSession(name.trim(), videoId, topic.trim())
      ctxStart(session_id, name.trim(), topic.trim(), url.trim())
      navigate('/session')
    } catch {
      setError('Could not connect to Empath backend. Is it running on port 8000?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4 relative overflow-hidden">
      <FloatingDecorations />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="card p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-extrabold">E</span>
            </div>
            <span className="font-bold text-xl">Empath</span>
          </div>

          <h1 className="text-3xl font-extrabold mb-2">Let's get you set up</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            We'll use your webcam to track focus. No footage is stored or sent anywhere.
          </p>

          <div className="h-px bg-border mb-8" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">Your name</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Derrick"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">What are you studying?</label>
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Introduction to Machine Learning"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-widest mb-2">YouTube video URL</label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="pill-btn w-full text-base py-4 mt-4 disabled:opacity-50"
            >
              {loading ? 'Starting...' : 'Begin Session →'}
            </button>
          </form>

          <p className="text-gray-600 text-xs text-center mt-6">
            Webcam access will be requested on the next screen
          </p>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <button onClick={() => navigate('/')} className="text-gray-600 text-sm hover:text-white transition-colors">
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  )
}
```

**Step 2: Verify**

Open `http://localhost:5173/start`.
- Dark bg, floating emotion pills in background
- Card centered with form inputs
- Fill in all fields, click "Begin Session →"
  - If backend is running: navigates to `/session`
  - If backend is not running: shows the error message in red

---

### Task 10: Session Page — Layout + Video Player

**Files:**
- Create: `frontend/src/components/VideoPlayer.jsx`
- Modify: `frontend/src/pages/SessionPage.jsx`

**Step 1: Create `frontend/src/components/VideoPlayer.jsx`**

Extracts YouTube video ID from a URL and embeds it. Fires behavior events on pause/play.

```jsx
import YouTube from 'react-youtube'

function extractVideoId(url) {
  try {
    const u = new URL(url)
    return u.searchParams.get('v') || u.pathname.split('/').pop() || ''
  } catch {
    return url // assume it's already an ID
  }
}

export default function VideoPlayer({ url, onPause, onPlay, onSeek }) {
  const videoId = extractVideoId(url)

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
    },
  }

  let lastTime = 0

  function onStateChange(e) {
    const player = e.target
    const state = e.data

    // YouTube player states: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering, 5=cued
    if (state === 2) onPause?.(player.getCurrentTime())
    if (state === 1) {
      const current = player.getCurrentTime()
      if (Math.abs(current - lastTime) > 3) {
        // Jumped more than 3s — treat as seek (rewind or fast-forward)
        if (current < lastTime) onSeek?.('rewind', current)
        else onSeek?.('fast_forward', current)
      }
      onPlay?.(current)
      lastTime = current
    }
  }

  if (!videoId) {
    return (
      <div className="w-full aspect-video bg-surface rounded-2xl flex items-center justify-center text-gray-600">
        Invalid YouTube URL
      </div>
    )
  }

  return (
    <div className="w-full aspect-video rounded-2xl overflow-hidden">
      <YouTube videoId={videoId} opts={opts} onStateChange={onStateChange} className="w-full h-full" iframeClassName="w-full h-full" />
    </div>
  )
}
```

**Step 2: Write initial SessionPage shell**

```jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { useWebcam } from '../hooks/useWebcam'
import VideoPlayer from '../components/VideoPlayer'
import { analyzeEmotion, computeScore, getSuggestion, sendBehaviorEvent, endSession } from '../api'

const EMOTION_COLORS = {
  focused: '#4ADE80', neutral: '#FACC15', confused: '#FB923C',
  bored: '#F472B6', distressed: '#F87171',
}
const EMOTION_EMOJI = {
  focused: '😊', neutral: '😐', confused: '🤔', bored: '😴', distressed: '😟'
}

export default function SessionPage() {
  const navigate = useNavigate()
  const { sessionId, topic, videoUrl, clearSession } = useSession()
  const { videoRef, canvasRef, hasPermission, requestPermission, captureFrame, stopStream } = useWebcam()

  const [emotion, setEmotion] = useState('neutral')
  const [confidence, setConfidence] = useState(0)
  const [focusScore, setFocusScore] = useState(70)
  const [engagementState, setEngagementState] = useState('neutral')
  const [phoneDetected, setPhoneDetected] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [chartData, setChartData] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isEnding, setIsEnding] = useState(false)

  const recentEventsRef = useRef([])
  const lastSuggestionStateRef = useRef(null)
  const analyzeIntervalRef = useRef(null)
  const timerRef = useRef(null)

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) navigate('/start')
  }, [sessionId])

  // Request webcam on mount
  useEffect(() => {
    requestPermission()
    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => s + 1)
    }, 1000)
    return () => {
      clearInterval(timerRef.current)
      stopAnalyzeLoop()
    }
  }, [])

  // Start analyze loop when webcam is ready
  useEffect(() => {
    if (hasPermission === true) {
      startAnalyzeLoop()
    }
    return () => stopAnalyzeLoop()
  }, [hasPermission])

  function startAnalyzeLoop() {
    analyzeIntervalRef.current = setInterval(analyzeFrame, 2000)
  }

  function stopAnalyzeLoop() {
    if (analyzeIntervalRef.current) {
      clearInterval(analyzeIntervalRef.current)
    }
  }

  async function analyzeFrame() {
    if (!sessionId) return
    const blob = await captureFrame()
    if (!blob) return

    const ts = elapsedSeconds

    try {
      const emotionResult = await analyzeEmotion(blob)
      const detectedEmotion = emotionResult.emotion
      const detectedConf = emotionResult.confidence
      const detectedPhone = emotionResult.phone_detected

      setEmotion(detectedEmotion)
      setConfidence(detectedConf)

      if (detectedPhone) {
        setPhoneDetected(true)
        recentEventsRef.current = [...recentEventsRef.current.slice(-4), 'phone_detected']
        await sendBehaviorEvent(sessionId, ts, 'phone_detected')
        setTimeout(() => setPhoneDetected(false), 4000)
      }

      const events = recentEventsRef.current
      const scoreResult = await computeScore(sessionId, detectedEmotion, detectedConf, events, ts)
      const score = scoreResult.focus_score
      const state = scoreResult.engagement_state

      setFocusScore(score)
      setEngagementState(state)
      setChartData(prev => [...prev.slice(-60), { time: ts, score, emotion: detectedEmotion }])

      // Suggest if score < 50 and state changed
      if (score < 50 && state !== lastSuggestionStateRef.current) {
        lastSuggestionStateRef.current = state
        const sugResult = await getSuggestion(sessionId, state, topic, ts)
        const newSuggestion = { ...sugResult, timestamp: ts, id: Date.now() }
        setSuggestion(newSuggestion)
        setSuggestions(prev => [newSuggestion, ...prev].slice(0, 10))
        setTimeout(() => setSuggestion(null), 8000)
      }
    } catch (err) {
      console.error('analyze error:', err)
    }
  }

  async function handleBehaviorEvent(type, ts) {
    if (!sessionId) return
    recentEventsRef.current = [...recentEventsRef.current.slice(-4), type]
    await sendBehaviorEvent(sessionId, ts, type)
  }

  async function handleEndSession() {
    if (isEnding) return
    setIsEnding(true)
    stopAnalyzeLoop()
    clearInterval(timerRef.current)
    stopStream()
    try {
      await endSession(sessionId)
    } catch {}
    const id = sessionId
    clearSession()
    navigate(`/report/${id}`)
  }

  function formatTime(s) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const emotionColor = EMOTION_COLORS[emotion] || '#888'

  if (!sessionId) return null

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
           style={{ background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #2A2A2A' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-extrabold text-xs">E</span>
          </div>
          <span className="text-gray-400 text-sm truncate max-w-xs">{topic}</span>
        </div>
        <div className="text-white font-mono text-lg">{formatTime(elapsedSeconds)}</div>
        <button
          onClick={handleEndSession}
          disabled={isEnding}
          className="px-5 py-2 rounded-full border border-red-500/50 text-red-400 text-sm
                     hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-50"
        >
          {isEnding ? 'Ending...' : 'End Session'}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-6">

        {/* Video area (relative container for floating overlays) */}
        <div className="relative w-full max-w-5xl">
          <VideoPlayer
            url={videoUrl}
            onPause={(ts) => handleBehaviorEvent('pause', ts)}
            onPlay={() => {}}
            onSeek={(type, ts) => handleBehaviorEvent(type, ts)}
          />

          {/* Focus Score — top right overlay */}
          <motion.div
            className="absolute top-4 right-4 flex flex-col items-center justify-center"
            style={{ width: 90, height: 90 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.4, when: 'afterChildren' }}
          >
            <svg className="absolute inset-0" width="90" height="90" viewBox="0 0 90 90">
              <circle cx="45" cy="45" r="38" fill="none" stroke="#2A2A2A" strokeWidth="6" />
              <circle
                cx="45" cy="45" r="38"
                fill="none"
                stroke={emotionColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - focusScore / 100)}`}
                transform="rotate(-90 45 45)"
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
              />
            </svg>
            <span className="relative text-2xl font-extrabold text-white">{focusScore}</span>
            <span className="relative text-xs text-gray-500">Focus</span>
          </motion.div>

          {/* Emotion pill — bottom left overlay */}
          <AnimatePresence mode="wait">
            <motion.div
              key={emotion}
              className="absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-bold text-black"
              style={{ backgroundColor: emotionColor }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {EMOTION_EMOJI[emotion]} {emotion}
            </motion.div>
          </AnimatePresence>

          {/* Webcam bubble — bottom right */}
          <div className="absolute bottom-4 right-4">
            <div className={`relative w-20 h-20 rounded-full overflow-hidden border-2 ${hasPermission ? 'border-green-400' : 'border-gray-600'}`}
                 style={{ boxShadow: hasPermission ? '0 0 0 3px rgba(74,222,128,0.3)' : 'none' }}>
              {hasPermission
                ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                : <div className="w-full h-full bg-surface flex items-center justify-center text-2xl">🔒</div>
              }
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Phone detected warning — bottom center */}
          <AnimatePresence>
            {phoneDetected && (
              <motion.div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: '#EF4444' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                📱 Phone detected — Focus -40
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Suggestion alert */}
        <AnimatePresence>
          {suggestion && (
            <motion.div
              className="fixed right-6 top-24 w-80 card z-50 shadow-2xl"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-widest">Empath Suggests</span>
                <button onClick={() => setSuggestion(null)} className="text-gray-600 hover:text-white text-lg leading-none">×</button>
              </div>
              <p className="text-sm text-white leading-relaxed mb-3">{suggestion.suggestion}</p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-gray-300">
                {suggestion.action?.replace(/_/g, ' ')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Focus chart */}
        <FocusChartSection chartData={chartData} emotion={emotion} />

        {/* Suggestion history */}
        {suggestions.length > 0 && (
          <div className="w-full max-w-5xl mt-4">
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">Past Suggestions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <span key={s.id} className="px-3 py-1 rounded-full text-xs bg-surface border border-border text-gray-400">
                  [{Math.floor(s.timestamp / 60)}:{String(s.timestamp % 60).padStart(2,'0')}] {s.suggestion.slice(0, 40)}...
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

function FocusChartSection({ chartData, emotion }) {
  const EMOTION_COLORS = {
    focused: '#4ADE80', neutral: '#FACC15', confused: '#FB923C',
    bored: '#F472B6', distressed: '#F87171',
  }
  const color = EMOTION_COLORS[emotion] || '#888'

  return (
    <div className="w-full max-w-5xl mt-6 card">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Focus Timeline</span>
        <span className="text-xs text-gray-600">Last 2 minutes</span>
      </div>
      {chartData.length < 2 ? (
        <div className="h-24 flex items-center justify-center text-gray-600 text-sm">Collecting data...</div>
      ) : (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} hide />
            <Tooltip
              contentStyle={{ background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 12 }}
              formatter={(v) => [`${v}`, 'Focus']}
            />
            <ReferenceLine y={80} stroke="#2A2A2A" strokeDasharray="3 3" />
            <ReferenceLine y={40} stroke="#2A2A2A" strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="score"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
```

**Step 3: Verify**

Start backend: `cd d:/Projects/Empath/backend && conda run -n empath uvicorn main:app --reload`

Open `http://localhost:5173/start`, fill form, click Begin Session.
- Should land on `/session`
- YouTube video should embed and play
- Webcam permission prompt appears
- After granting: small circular webcam feed visible bottom-right
- Focus score ring visible top-right of video
- After ~2 seconds: emotion pill appears bottom-left, chart starts showing data

---

### Task 11: Report Page

**Files:**
- Modify: `frontend/src/pages/ReportPage.jsx`

**Step 1: Write the full ReportPage**

```jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getSessionReport } from '../api'

const EMOTION_COLORS = {
  focused: '#4ADE80', neutral: '#FACC15', confused: '#FB923C',
  bored: '#F472B6', distressed: '#F87171',
}

function ScoreRing({ score }) {
  const color = score >= 80 ? '#4ADE80' : score >= 60 ? '#FACC15' : score >= 40 ? '#FB923C' : '#F87171'
  const r = 70
  const circ = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: 180, height: 180 }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#2A2A2A" strokeWidth="10" />
        <circle
          cx="90" cy="90" r={r}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold text-white">{score}</span>
        <span className="text-xs text-gray-500 mt-1">/ 100</span>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getSessionReport(sessionId)
      .then(setReport)
      .catch(() => setError('Could not load report. Session may have expired.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-gray-500">Loading report...</div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">{error || 'Report not found.'}</p>
        <button onClick={() => navigate('/start')} className="pill-btn">Start New Session</button>
      </div>
    )
  }

  const avgScore = Math.round(report.average_focus_score || 0)
  const scoreColor = EMOTION_COLORS[
    avgScore >= 80 ? 'focused' : avgScore >= 60 ? 'neutral' : avgScore >= 40 ? 'confused' : avgScore >= 20 ? 'bored' : 'distressed'
  ]

  // Build emotion breakdown from timeline
  const timeline = report.focus_timeline || []
  const emotionCounts = {}
  timeline.forEach(p => {
    emotionCounts[p.emotion] = (emotionCounts[p.emotion] || 0) + 1
  })
  const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0) || 1
  const emotions = ['focused', 'neutral', 'confused', 'bored', 'distressed']

  return (
    <div className="min-h-screen bg-bg text-white pb-16">

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border">
        <button onClick={() => navigate('/start')} className="text-gray-500 hover:text-white text-sm transition-colors">
          ← New Session
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold">Session Report</h1>
          <p className="text-xs text-gray-600">ID: {sessionId?.slice(0, 8)}...</p>
        </div>
        <div style={{ width: 100 }} />
      </div>

      {/* Hero stat */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 border-b border-border"
      >
        <p className="text-gray-500 text-sm uppercase tracking-widest mb-6">Average Focus Score</p>
        <ScoreRing score={avgScore} />
        <p className="text-gray-500 text-sm mt-6">
          {report.total_events || 0} behavior events recorded
        </p>
      </motion.div>

      <div className="max-w-5xl mx-auto px-8 space-y-8 mt-8">

        {/* Emotion breakdown */}
        <div>
          <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-4">Emotion Breakdown</h2>
          <div className="grid grid-cols-5 gap-3">
            {emotions.map(em => {
              const count = emotionCounts[em] || 0
              const pct = Math.round((count / total) * 100)
              const secs = count * 2 // 2s intervals
              return (
                <div key={em} className="card text-center" style={{ borderTopColor: EMOTION_COLORS[em], borderTopWidth: 3 }}>
                  <div className="text-2xl mb-1">{pct}%</div>
                  <div className="capitalize text-sm font-semibold">{em}</div>
                  <div className="text-xs text-gray-600 mt-1">{secs}s</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Timeline chart */}
        {timeline.length > 1 && (
          <div>
            <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-4">Focus Timeline</h2>
            <div className="card">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scoreColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={scoreColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="timestamp_seconds"
                    tickFormatter={v => `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`}
                    tick={{ fill: '#555', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#1E1E1E', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`${v}`, 'Focus Score']}
                  />
                  <ReferenceLine y={80} stroke="#2A2A2A" strokeDasharray="3 3" label={{ value: 'Focused', fill: '#555', fontSize: 10 }} />
                  <ReferenceLine y={40} stroke="#2A2A2A" strokeDasharray="3 3" label={{ value: 'Confused', fill: '#555', fontSize: 10 }} />
                  <Area type="monotone" dataKey="focus_score" stroke={scoreColor} strokeWidth={2}
                        fill="url(#scoreGrad)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Suggestions given */}
        {report.suggestions && report.suggestions.length > 0 && (
          <div>
            <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-4">
              AI Suggestions ({report.suggestions.length})
            </h2>
            <div className="space-y-3">
              {report.suggestions.map((s, i) => (
                <div key={i} className="card flex items-start gap-4">
                  <span className="text-xs text-gray-600 font-mono mt-1 shrink-0">
                    {Math.floor(s.timestamp_seconds/60)}:{String(Math.round(s.timestamp_seconds)%60).padStart(2,'0')}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-white">{s.suggestion_text}</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-white/10 text-gray-400">
                      {s.action?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!report.suggestions?.length && (
          <div className="card text-center py-8">
            <p className="text-gray-600">No suggestions were needed — great session! 🎉</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-4">
          <button onClick={() => navigate('/start')} className="pill-btn-solid px-8 py-3">
            Start New Session →
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="pill-btn px-8 py-3"
          >
            Copy Report Link
          </button>
        </div>

      </div>
    </div>
  )
}
```

**Step 2: Verify**

After ending a session from the session page, you should be redirected to `/report/:sessionId`.
- Hero score ring animates in with correct score
- Emotion breakdown shows 5 colored cards
- If session had events: chart shows timeline
- "Start New Session" button navigates back to `/start`

If you want to test without running a full session:
Navigate directly to `/report/test-session-id` — should show "Could not load report" error gracefully.

---

### Task 12: Final Polish + Integration Verification

**Files:**
- Modify: `frontend/src/pages/SessionPage.jsx` (minor fix if needed)

**Step 1: Fix the `elapsedSeconds` ref issue**

The `analyzeFrame` closure captures `elapsedSeconds` at mount time. Use a ref instead:

In SessionPage.jsx, add after existing state declarations:
```jsx
const elapsedRef = useRef(0)
```

Update the timer:
```jsx
timerRef.current = setInterval(() => {
  setElapsedSeconds(s => {
    elapsedRef.current = s + 1
    return s + 1
  })
}, 1000)
```

In `analyzeFrame`, replace `const ts = elapsedSeconds` with `const ts = elapsedRef.current`.

**Step 2: Full integration test**

Start backend:
```bash
cd d:/Projects/Empath/backend
conda run -n empath uvicorn main:app --reload --port 8000
```

Start frontend:
```bash
cd d:/Projects/Empath/frontend
npm run dev
```

Walk through the full flow:
1. Open `http://localhost:5173/` → Landing page loads, floating pills animate
2. Click "Start Learning →" → navigates to `/start`
3. Fill in: Name=Test, Topic=Machine Learning, URL=`https://youtube.com/watch?v=aircAruvnKk`
4. Click "Begin Session →" → navigates to `/session`
5. Allow webcam → webcam bubble appears, pulsing green ring
6. Video loads and plays automatically
7. After 2s: emotion pill appears, focus score ring updates
8. Pause the video → behavior event sent (check backend terminal for log)
9. Click "End Session" → redirected to `/report/<session_id>`
10. Report shows average score, emotion breakdown, timeline chart

**Step 3: Build check**

```bash
cd d:/Projects/Empath/frontend
npm run build
```

Expected: "build successful" with bundle sizes listed. No errors.

---

## Summary

Total tasks: 12
Pages: Landing, Quick Start, Session (cinematic), Report
Key integrations: Webcam → FastAPI → YouTube IFrame → Recharts chart → Supabase (via backend)
Webcam interval: 2 seconds (matches `setInterval(analyzeFrame, 2000)`)
Phone detection: auto-fires behavior event when `phone_detected: true` in API response

**When all tasks pass, offer to run `npm run build` and confirm zero errors.**
