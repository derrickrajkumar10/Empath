# Empath — Developer's Bible
### The Single Source of Truth for Building Empath

*Claude Code: Follow this spec exactly. Ask for clarification before writing code if anything is ambiguous.*

---

## Project Overview

Build Empath: an Emotion-Aware Adaptive Learning Assistant.

A student watches a video lesson. Empath:
1. Captures webcam frames every 5 seconds → sends to backend → HuggingFace emotion model → returns emotion label
2. Tracks video interaction events (pause, rewind, etc.) → sends to backend → stored in Supabase
3. Combines both signals → computes Focus Score (0–100) every 5 seconds
4. When score < 50 → second HuggingFace model generates adaptive suggestion → displayed to student
5. All session data stored in Supabase → session report generated at end

---

## Repository Structure

    empath/
    ├── frontend/
    │   ├── src/
    │   │   ├── components/
    │   │   │   ├── VideoPlayer.jsx
    │   │   │   ├── WebcamCapture.jsx
    │   │   │   ├── FocusScoreGauge.jsx
    │   │   │   ├── EmotionTimeline.jsx
    │   │   │   ├── SuggestionCard.jsx
    │   │   │   ├── EngagementHeatmap.jsx
    │   │   │   └── SessionReport.jsx
    │   │   ├── hooks/
    │   │   │   ├── useWebcam.js
    │   │   │   ├── useBehavior.js
    │   │   │   └── useEngagement.js
    │   │   ├── api/
    │   │   │   └── empathApi.js
    │   │   ├── App.jsx
    │   │   └── main.jsx
    │   ├── package.json
    │   ├── vite.config.js
    │   └── tailwind.config.js
    │
    ├── backend/
    │   ├── main.py
    │   ├── models/
    │   │   ├── emotion_model.py
    │   │   └── suggestion_model.py
    │   ├── services/
    │   │   ├── scoring.py
    │   │   └── session.py
    │   ├── database/
    │   │   └── db.py
    │   ├── schemas/
    │   │   └── schemas.py
    │   ├── requirements.txt
    │   └── .env
    │
    └── README.md

---

## STEP 0 — Supabase Setup (Do This Before Writing Any Code)

### 0.1 Create Supabase Project
1. Go to https://supabase.com → New Project
2. Name it `empath`
3. Set a strong database password (save it)
4. Choose region closest to your location
5. Wait for project to initialize (~2 minutes)

### 0.2 Get Credentials
From Project Settings → API:
- `SUPABASE_URL` = your project URL (https://xxxx.supabase.co)
- `SUPABASE_ANON_KEY` = your anon/public key

### 0.3 Run This SQL in Supabase SQL Editor
```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Sessions table
create table sessions (
  id uuid default uuid_generate_v4() primary key,
  student_id text not null default 'student_001',
  video_id text not null default 'video_001',
  topic text not null default 'General',
  started_at timestamptz default now(),
  ended_at timestamptz
);

-- Emotion events table
create table emotion_events (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references sessions(id) on delete cascade,
  timestamp_seconds float not null,
  emotion text not null,
  confidence float not null,
  focus_score integer not null,
  created_at timestamptz default now()
);

-- Behavior events table
create table behavior_events (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references sessions(id) on delete cascade,
  timestamp_seconds float not null,
  event_type text not null,
  created_at timestamptz default now()
);

-- Suggestions table
create table suggestions (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references sessions(id) on delete cascade,
  timestamp_seconds float not null,
  engagement_state text not null,
  suggestion_text text not null,
  action text not null,
  was_acted_on boolean default false,
  created_at timestamptz default now()
);

-- Disable RLS for hackathon (enable + add policies for production)
alter table sessions disable row level security;
alter table emotion_events disable row level security;
alter table behavior_events disable row level security;
alter table suggestions disable row level security;
```

---

## Backend — Complete Spec

### requirements.txt
```
fastapi==0.111.0
uvicorn==0.29.0
transformers==4.41.0
torch==2.3.0
torchvision==0.18.0
Pillow==10.3.0
pydantic==2.7.0
python-multipart==0.0.9
python-dotenv==1.0.1
supabase==2.4.6
numpy==1.26.4
```

### .env
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
CORS_ORIGINS=http://localhost:5173
```

### database/db.py
```python
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_ANON_KEY"]
)
```

### schemas/schemas.py
```python
from pydantic import BaseModel
from typing import Optional, List

class BehaviorEventRequest(BaseModel):
    session_id: str
    event_type: str  # pause | rewind | fast_forward | idle_start | idle_end | play
    timestamp_seconds: float

class ComputeScoreRequest(BaseModel):
    session_id: str
    emotion: str
    confidence: float
    recent_events: List[str]  # list of event_type strings from last 60s

class SuggestionRequest(BaseModel):
    session_id: str
    engagement_state: str
    topic: str
    timestamp_seconds: float

class EmotionResponse(BaseModel):
    emotion: str
    confidence: float

class ScoreResponse(BaseModel):
    focus_score: int
    engagement_state: str

class SuggestionResponse(BaseModel):
    suggestion: str
    action: str  # slow_video | speed_up | show_quiz | show_break | nudge | none
```

### models/emotion_model.py
```python
from transformers import pipeline
from PIL import Image
import io

# Loaded once at startup — stored as module-level global
emotion_pipeline = None

def load_model():
    global emotion_pipeline
    emotion_pipeline = pipeline(
        "image-classification",
        model="dima806/facial_emotions_image_detection"
    )

def analyze_frame(image_bytes: bytes) -> dict:
    """
    Takes raw JPEG bytes from webcam frame.
    Returns { emotion: str, confidence: float }
    Maps model labels to our 5 states.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = emotion_pipeline(image)
    top = results[0]

    # Map model output labels to our emotion states
    label_map = {
        "happy": "focused",
        "surprise": "focused",
        "neutral": "neutral",
        "fear": "distressed",
        "sad": "distressed",
        "disgust": "bored",
        "angry": "distressed",
        "contempt": "bored"
    }

    raw_label = top["label"].lower()
    emotion = label_map.get(raw_label, "neutral")

    return {
        "emotion": emotion,
        "confidence": round(top["score"], 3)
    }
```

### models/suggestion_model.py
```python
from transformers import pipeline

suggestion_pipeline = None

def load_model():
    global suggestion_pipeline
    suggestion_pipeline = pipeline(
        "text2text-generation",
        model="google/flan-t5-base",
        max_new_tokens=80
    )

# Maps engagement state to action code
ACTION_MAP = {
    "confused": "slow_video",
    "bored": "speed_up",
    "distressed": "show_break",
    "neutral": "nudge",
    "focused": "none"
}

def generate_suggestion(engagement_state: str, topic: str) -> dict:
    prompt = (
        f"A student is watching a video lesson about {topic}. "
        f"They appear {engagement_state}. "
        f"Write one friendly sentence to help them re-engage."
    )

    result = suggestion_pipeline(prompt)[0]["generated_text"]
    action = ACTION_MAP.get(engagement_state, "nudge")

    return {
        "suggestion": result.strip(),
        "action": action
    }
```

### services/scoring.py
```python
EMOTION_SCORES = {
    "focused": 90,
    "neutral": 70,
    "confused": 50,
    "bored": 30,
    "distressed": 20
}

BEHAVIOR_PENALTIES = {
    "pause": -10,
    "rewind": -15,
    "fast_forward": -20,
    "idle_start": -30
}

ENGAGEMENT_THRESHOLDS = [
    (80, "focused"),
    (60, "neutral"),
    (40, "confused"),
    (20, "bored"),
    (0, "distressed")
]

def compute_focus_score(emotion: str, recent_events: list) -> dict:
    emotion_score = EMOTION_SCORES.get(emotion, 70)

    behavior_penalty = sum(
        BEHAVIOR_PENALTIES.get(event, 0)
        for event in recent_events
    )

    behavior_score = max(0, 100 + behavior_penalty)

    focus_score = int(
        (emotion_score * 0.6) + (behavior_score * 0.4)
    )
    focus_score = max(0, min(100, focus_score))

    engagement_state = "focused"
    for threshold, state in ENGAGEMENT_THRESHOLDS:
        if focus_score >= threshold:
            engagement_state = state
            break

    return {
        "focus_score": focus_score,
        "engagement_state": engagement_state
    }
```

### services/session.py
```python
from database.db import supabase
from datetime import datetime, timezone

def create_session(student_id: str, video_id: str, topic: str) -> str:
    result = supabase.table("sessions").insert({
        "student_id": student_id,
        "video_id": video_id,
        "topic": topic
    }).execute()
    return result.data[0]["id"]

def save_emotion_event(session_id, timestamp_seconds, emotion, confidence, focus_score):
    supabase.table("emotion_events").insert({
        "session_id": session_id,
        "timestamp_seconds": timestamp_seconds,
        "emotion": emotion,
        "confidence": confidence,
        "focus_score": focus_score
    }).execute()

def save_behavior_event(session_id, timestamp_seconds, event_type):
    supabase.table("behavior_events").insert({
        "session_id": session_id,
        "timestamp_seconds": timestamp_seconds,
        "event_type": event_type
    }).execute()

def save_suggestion(session_id, timestamp_seconds, engagement_state, suggestion_text, action):
    supabase.table("suggestions").insert({
        "session_id": session_id,
        "timestamp_seconds": timestamp_seconds,
        "engagement_state": engagement_state,
        "suggestion_text": suggestion_text,
        "action": action
    }).execute()

def get_session_report(session_id: str) -> dict:
    emotions = supabase.table("emotion_events") \
        .select("*").eq("session_id", session_id) \
        .order("timestamp_seconds").execute().data

    behaviors = supabase.table("behavior_events") \
        .select("*").eq("session_id", session_id) \
        .order("timestamp_seconds").execute().data

    suggestions = supabase.table("suggestions") \
        .select("*").eq("session_id", session_id) \
        .order("timestamp_seconds").execute().data

    avg_score = (
        sum(e["focus_score"] for e in emotions) / len(emotions)
        if emotions else 0
    )

    emotion_counts = {}
    for e in emotions:
        emotion_counts[e["emotion"]] = emotion_counts.get(e["emotion"], 0) + 1

    return {
        "session_id": session_id,
        "average_focus_score": round(avg_score, 1),
        "emotion_distribution": emotion_counts,
        "focus_timeline": [
            {"t": e["timestamp_seconds"], "score": e["focus_score"], "emotion": e["emotion"]}
            for e in emotions
        ],
        "behavior_events": behaviors,
        "suggestions_given": suggestions,
        "total_events": len(behaviors)
    }

def end_session(session_id: str):
    supabase.table("sessions").update({
        "ended_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", session_id).execute()
```

### main.py — Complete API
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from models import emotion_model, suggestion_model
from services import scoring, session as session_service
from schemas.schemas import (
    BehaviorEventRequest, ComputeScoreRequest,
    SuggestionRequest, EmotionResponse, ScoreResponse, SuggestionResponse
)

models_ready = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    global models_ready
    print("Loading HuggingFace models... (this takes 20–30s on first run)")
    emotion_model.load_model()
    suggestion_model.load_model()
    models_ready = True
    print("Models ready.")
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"models_ready": models_ready}

@app.post("/api/start-session")
def start_session(student_id: str = "student_001", video_id: str = "video_001", topic: str = "General"):
    session_id = session_service.create_session(student_id, video_id, topic)
    return {"session_id": session_id}

@app.post("/api/analyze-emotion", response_model=EmotionResponse)
async def analyze_emotion(file: UploadFile = File(...)):
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models still loading")
    image_bytes = await file.read()
    result = emotion_model.analyze_frame(image_bytes)
    return result

@app.post("/api/behavior-event")
def behavior_event(req: BehaviorEventRequest):
    session_service.save_behavior_event(
        req.session_id, req.timestamp_seconds, req.event_type
    )
    return {"received": True}

@app.post("/api/compute-score", response_model=ScoreResponse)
def compute_score(req: ComputeScoreRequest):
    result = scoring.compute_focus_score(req.emotion, req.recent_events)
    session_service.save_emotion_event(
        req.session_id,
        0,  # timestamp passed separately in production; use req fields
        req.emotion,
        req.confidence,
        result["focus_score"]
    )
    return result

@app.post("/api/get-suggestion", response_model=SuggestionResponse)
def get_suggestion(req: SuggestionRequest):
    result = suggestion_model.generate_suggestion(req.engagement_state, req.topic)
    session_service.save_suggestion(
        req.session_id,
        req.timestamp_seconds,
        req.engagement_state,
        result["suggestion"],
        result["action"]
    )
    return result

@app.get("/api/session-report/{session_id}")
def session_report(session_id: str):
    return session_service.get_session_report(session_id)

@app.post("/api/end-session/{session_id}")
def end_session(session_id: str):
    session_service.end_session(session_id)
    return {"ended": True}
```

---

## Frontend — Complete Spec

### package.json dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "recharts": "^2.12.0",
    "framer-motion": "^11.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### api/empathApi.js
```javascript
import axios from 'axios'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const checkHealth = () =>
  axios.get(`${BASE}/api/health`).then(r => r.data)

export const startSession = (params = {}) =>
  axios.post(`${BASE}/api/start-session`, null, { params }).then(r => r.data)

export const analyzeEmotion = (imageBlob) => {
  const form = new FormData()
  form.append('file', imageBlob, 'frame.jpg')
  return axios.post(`${BASE}/api/analyze-emotion`, form).then(r => r.data)
}

export const sendBehaviorEvent = (data) =>
  axios.post(`${BASE}/api/behavior-event`, data).then(r => r.data)

export const computeScore = (data) =>
  axios.post(`${BASE}/api/compute-score`, data).then(r => r.data)

export const getSuggestion = (data) =>
  axios.post(`${BASE}/api/get-suggestion`, data).then(r => r.data)

export const getSessionReport = (sessionId) =>
  axios.get(`${BASE}/api/session-report/${sessionId}`).then(r => r.data)

export const endSession = (sessionId) =>
  axios.post(`${BASE}/api/end-session/${sessionId}`).then(r => r.data)
```

### hooks/useWebcam.js
```javascript
import { useRef, useEffect, useState, useCallback } from 'react'
import { analyzeEmotion } from '../api/empathApi'

export function useWebcam() {
  const videoRef = useRef(null)      // hidden <video> element for webcam stream
  const canvasRef = useRef(null)     // hidden <canvas> for frame capture
  const [emotion, setEmotion] = useState('neutral')
  const [confidence, setConfidence] = useState(0)
  const [hasPermission, setHasPermission] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    async function startWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setHasPermission(true)
        }
      } catch (err) {
        console.warn('Webcam denied. Falling back to behavior-only tracking.', err)
        setHasPermission(false)
      }
    }
    startWebcam()
    return () => {
      intervalRef.current && clearInterval(intervalRef.current)
    }
  }, [])

  const startCapturing = useCallback((onFrame) => {
    if (!hasPermission) return
    intervalRef.current = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return
      const canvas = canvasRef.current
      canvas.width = 224
      canvas.height = 224
      const ctx = canvas.getContext('2d')
      ctx.drawImage(videoRef.current, 0, 0, 224, 224)
      canvas.toBlob(async (blob) => {
        if (!blob) return
        try {
          const result = await analyzeEmotion(blob)
          setEmotion(result.emotion)
          setConfidence(result.confidence)
          onFrame && onFrame(result)
        } catch (err) {
          console.error('Emotion analysis failed:', err)
        }
      }, 'image/jpeg', 0.7)  // Compressed JPEG
    }, 5000)  // Every 5 seconds
  }, [hasPermission])

  const stopCapturing = useCallback(() => {
    clearInterval(intervalRef.current)
  }, [])

  return { videoRef, canvasRef, emotion, confidence, hasPermission, startCapturing, stopCapturing }
}
```

### hooks/useBehavior.js
```javascript
import { useRef, useCallback } from 'react'
import { sendBehaviorEvent } from '../api/empathApi'

export function useBehavior(sessionId) {
  const eventsRef = useRef([])       // recent events list for scoring
  const lastSeekTime = useRef(null)
  const idleTimerRef = useRef(null)
  const videoRef = useRef(null)

  const resetIdleTimer = useCallback(() => {
    clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      const event = { type: 'idle_start', ts: videoRef.current?.currentTime || 0 }
      eventsRef.current.push(event.type)
      sendBehaviorEvent({ session_id: sessionId, event_type: 'idle_start', timestamp_seconds: event.ts })
    }, 30000)
  }, [sessionId])

  const attachToVideo = useCallback((videoElement) => {
    videoRef.current = videoElement
    if (!videoElement) return

    const send = (type) => {
      const ts = videoElement.currentTime
      eventsRef.current.push(type)
      if (eventsRef.current.length > 20) eventsRef.current.shift()  // keep last 20
      sendBehaviorEvent({ session_id: sessionId, event_type: type, timestamp_seconds: ts })
    }

    videoElement.addEventListener('pause', () => send('pause'))
    videoElement.addEventListener('play', () => send('play'))
    videoElement.addEventListener('ratechange', () => send('rate_change'))
    videoElement.addEventListener('seeked', () => {
      const seekDir = videoElement.currentTime < (lastSeekTime.current || 0) ? 'rewind' : 'fast_forward'
      send(seekDir)
      lastSeekTime.current = videoElement.currentTime
    })

    document.addEventListener('mousemove', resetIdleTimer)
    document.addEventListener('keydown', resetIdleTimer)
  }, [sessionId, resetIdleTimer])

  const getRecentEvents = useCallback(() => [...eventsRef.current], [])

  return { attachToVideo, getRecentEvents }
}
```

### hooks/useEngagement.js
```javascript
import { useState, useRef, useCallback } from 'react'
import { computeScore, getSuggestion } from '../api/empathApi'

export function useEngagement(sessionId, topic = 'General') {
  const [focusScore, setFocusScore] = useState(80)
  const [engagementState, setEngagementState] = useState('focused')
  const [suggestion, setSuggestion] = useState(null)
  const [timeline, setTimeline] = useState([])
  const lastStateRef = useRef('focused')

  const updateEngagement = useCallback(async (emotion, confidence, recentEvents) => {
    try {
      const scoreResult = await computeScore({
        session_id: sessionId,
        emotion,
        confidence,
        recent_events: recentEvents
      })

      setFocusScore(scoreResult.focus_score)
      setEngagementState(scoreResult.engagement_state)
      setTimeline(prev => [...prev, {
        time: Date.now(),
        score: scoreResult.focus_score,
        emotion
      }])

      // Trigger suggestion if score dropped below 50 OR state changed to concern
      const shouldSuggest =
        scoreResult.focus_score < 50 &&
        scoreResult.engagement_state !== 'focused' &&
        scoreResult.engagement_state !== lastStateRef.current

      if (shouldSuggest) {
        lastStateRef.current = scoreResult.engagement_state
        const suggestionResult = await getSuggestion({
          session_id: sessionId,
          engagement_state: scoreResult.engagement_state,
          topic,
          timestamp_seconds: Date.now() / 1000
        })
        setSuggestion(suggestionResult)
      } else if (scoreResult.focus_score >= 80) {
        lastStateRef.current = 'focused'
        setSuggestion(null)
      }
    } catch (err) {
      console.error('Engagement update failed:', err)
    }
  }, [sessionId, topic])

  const dismissSuggestion = useCallback(() => setSuggestion(null), [])

  return { focusScore, engagementState, suggestion, timeline, updateEngagement, dismissSuggestion }
}
```

### App.jsx — Main Orchestration
```jsx
import { useState, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { checkHealth, startSession, endSession, getSessionReport } from './api/empathApi'
import VideoPlayer from './components/VideoPlayer'
import WebcamCapture from './components/WebcamCapture'
import FocusScoreGauge from './components/FocusScoreGauge'
import EmotionTimeline from './components/EmotionTimeline'
import SuggestionCard from './components/SuggestionCard'
import SessionReport from './components/SessionReport'
import { useWebcam } from './hooks/useWebcam'
import { useBehavior } from './hooks/useBehavior'
import { useEngagement } from './hooks/useEngagement'

export default function App() {
  const [sessionId, setSessionId] = useState(null)
  const [modelsReady, setModelsReady] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [report, setReport] = useState(null)
  const topic = 'Introduction to Machine Learning'

  // Poll /api/health until models are ready
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const { models_ready } = await checkHealth()
        if (models_ready) {
          setModelsReady(true)
          clearInterval(poll)
        }
      } catch {}
    }, 2000)
    return () => clearInterval(poll)
  }, [])

  // Start session when models are ready
  useEffect(() => {
    if (!modelsReady) return
    startSession({ topic }).then(({ session_id }) => setSessionId(session_id))
  }, [modelsReady])

  const { videoRef: webcamRef, canvasRef, emotion, confidence, hasPermission, startCapturing, stopCapturing } = useWebcam()
  const { attachToVideo, getRecentEvents } = useBehavior(sessionId)
  const { focusScore, engagementState, suggestion, timeline, updateEngagement, dismissSuggestion } = useEngagement(sessionId, topic)

  // Start webcam capturing after session starts
  useEffect(() => {
    if (!sessionId || !modelsReady) return
    startCapturing((emotionResult) => {
      updateEngagement(emotionResult.emotion, emotionResult.confidence, getRecentEvents())
    })
    return () => stopCapturing()
  }, [sessionId, modelsReady])

  const handleEndSession = async () => {
    stopCapturing()
    await endSession(sessionId)
    const reportData = await getSessionReport(sessionId)
    setReport(reportData)
    setSessionEnded(true)
  }

  if (!modelsReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xl">Loading AI Models...</p>
          <p className="text-slate-400 text-sm mt-2">This takes ~20 seconds on first run</p>
        </div>
      </div>
    )
  }

  if (sessionEnded && report) {
    return <SessionReport report={report} />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-400 mb-6">
          Project Empath — Adaptive Learning
        </h1>
        <div className="grid grid-cols-2 gap-6">
          {/* Left Panel */}
          <div className="space-y-4">
            <VideoPlayer attachToVideo={attachToVideo} />
            <WebcamCapture webcamRef={webcamRef} canvasRef={canvasRef} emotion={emotion} hasPermission={hasPermission} />
            <button
              onClick={handleEndSession}
              className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
            >
              End Session & View Report
            </button>
          </div>
          {/* Right Panel */}
          <div className="space-y-4">
            <FocusScoreGauge score={focusScore} state={engagementState} />
            <EmotionTimeline timeline={timeline} />
          </div>
        </div>
      </div>

      {suggestion && (
        <SuggestionCard
          suggestion={suggestion}
          onDismiss={dismissSuggestion}
        />
      )}
    </div>
  )
}
```

---

## Component Specs

### FocusScoreGauge.jsx
- Use `recharts` `RadialBarChart` OR pure CSS/SVG circular gauge
- Color: green (#22C55E) for ≥80, yellow (#EAB308) for 50–79, red (#EF4444) for <50
- Show score number in center
- Show engagement state label below
- Animate score changes with CSS transition

### EmotionTimeline.jsx
- Use `recharts` LineChart
- X-axis: time elapsed (derived from timeline array index × 5 seconds)
- Y-axis: Focus Score 0–100
- Add colored reference lines at 80 (green) and 50 (red)
- Add dot markers where suggestions were triggered

### SuggestionCard.jsx
- Fixed position: bottom-right of screen
- Use `framer-motion` for slide-in animation
- Show suggestion text, action button (mapped from action code), dismiss button
- Auto-dismiss after 10 seconds (use useEffect + setTimeout)
- Action button behavior:
  - `slow_video` → message "Slowing down video for you"
  - `speed_up` → message "Speeding up"
  - `show_quiz` → show a static quiz question
  - `show_break` → message "Take a 5-minute break"
  - `nudge` → just dismiss

### SessionReport.jsx
- Full screen overlay/page
- Show: average Focus Score, emotion distribution (recharts PieChart), focus timeline (LineChart)
- Show key moments: filter timeline where score < 50, list them as "At 4:30 — You appeared confused"
- Show suggestions that were given
- "Start New Session" button

### VideoPlayer.jsx
- Use an HTML `<video>` element with a local or remote educational MP4
- OR use a YouTube iframe embed (for demo: a Python tutorial video)
- Expose a ref for playback rate control
- Call `attachToVideo(videoElement)` in useEffect after mount

### WebcamCapture.jsx
- Small 160×120 preview in a card
- Show emotion badge: emoji + label
- If no permission: show "📷 Webcam unavailable — behavior tracking active"
- Hidden `<video>` (webcamRef) and hidden `<canvas>` (canvasRef) must be rendered in DOM

---

## Environment Variables

**Backend `.env`:**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key
CORS_ORIGINS=http://localhost:5173
```

**Frontend `.env`:**
```
VITE_API_URL=http://localhost:8000
```

---

## Startup Instructions
```bash
# 1. Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# Wait for "Models ready." in terminal before using frontend

# 2. Frontend
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## UI Design Tokens
```
Background:  #0F172A (slate-900)
Surface:     #1E293B (slate-800)
Accent:      #3B82F6 (blue-500)
Focus High:  #22C55E (green-500)
Focus Mid:   #EAB308 (yellow-500)
Focus Low:   #EF4444 (red-500)
Text:        #F8FAFC (slate-50)
Subtext:     #94A3B8 (slate-400)
Font:        Inter (import from Google Fonts)
```

---

## Critical Implementation Notes

1. **Model loading is slow** (~20–30 seconds). Frontend polls `/api/health` every 2 seconds. Show loading spinner until `models_ready: true`.

2. **JPEG compression is mandatory.** Use `canvas.toBlob(cb, 'image/jpeg', 0.7)`. Raw canvas data is too large.

3. **Never reload models per request.** Load at startup using FastAPI lifespan. Store as module-level globals.

4. **Session ID is a UUID** generated in App.jsx on load. Pass with every API call. Ties all events together.

5. **CORS must allow** `http://localhost:5173` from the FastAPI backend.

6. **Graceful degradation:** If webcam is denied, fall back to behavior-only. Focus Score still works, just less accurate. Show appropriate UI message.

7. **flan-t5 prompt length:** Keep under 80 tokens. Limit output to 80 tokens. Truncate with `max_new_tokens=80`.

8. **Supabase inserts are fire-and-forget** for behavior events. Don't await them in the scoring loop — use `.execute()` without blocking.

9. **Demo video:** Use a royalty-free YouTube embed or include a local `.mp4`. Suggested: any NPTEL or MIT OpenCourseWare clip about Python or ML.

10. **Label mapping in emotion_model.py is critical.** The dima806 model outputs standard emotion labels (happy, sad, etc.). Map them to your 5 states (focused, confused, bored, distressed, neutral) in the `label_map` dict.

---

## Definition of Done (MVP Checklist)

- [ ] Supabase tables created and accessible
- [ ] `/api/health` returns `{ models_ready: true }` after startup
- [ ] Webcam captures JPEG frames every 5s and sends to backend
- [ ] Backend returns emotion label for each frame
- [ ] Behavior events (pause, rewind, idle) tracked and stored in Supabase
- [ ] Focus Score computed and returned every 5s
- [ ] Score and state displayed live in FocusScoreGauge
- [ ] Emotion timeline updates in real time
- [ ] SuggestionCard appears when score < 50
- [ ] SuggestionCard auto-dismisses after 10s
- [ ] End Session triggers session report from Supabase
- [ ] Session Report shows timeline, emotion distribution, key moments
- [ ] App loads with spinner until models ready
- [ ] Graceful webcam fallback works
- [ ] CORS configured correctly
- [ ] End-to-end demo works with a real video