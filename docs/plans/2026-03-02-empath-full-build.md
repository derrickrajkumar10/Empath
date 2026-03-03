# Empath Full Build Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the complete Empath emotion-aware adaptive learning platform — backend (FastAPI + HuggingFace), frontend (React+Vite), and all UI components, end-to-end functional.

**Architecture:** FastAPI backend loads two HuggingFace models at startup (emotion classifier + suggestion generator, both CPU-only); React frontend polls webcam every 5s and tracks video behavior to compute a live Focus Score; Supabase stores all events; session report generated at end.

**Tech Stack:** Python 3.11 / FastAPI / PyTorch 2.5.1 CPU / HuggingFace Transformers / Supabase / React 18 / Vite / TailwindCSS / Recharts / Framer Motion / YouTube IFrame API

---

## PRE-BUILD: Supabase Setup (Manual — Do This Before Task 1)

1. Go to https://supabase.com → New Project → name it `empath`
2. From Settings → API, copy: `SUPABASE_URL` and `SUPABASE_ANON_KEY`
3. Open SQL Editor, run the entire SQL block from `EMPATH_DOC3_DEVELOPERS_BIBLE.md` §0.3
4. Confirm 4 tables exist: `sessions`, `emotion_events`, `behavior_events`, `suggestions`

---

## KEY DEVIATIONS FROM SPEC

These are intentional changes from the Developer's Bible:

| Spec Says | We Do Instead | Why |
|---|---|---|
| `torch==2.3.0` in requirements.txt | Omit torch from requirements.txt | Already installed in conda env as 2.5.1 CPU |
| `pipeline(...)` without device | `pipeline(..., device="cpu")` | CPU-only PyTorch installed in empath env |
| `timestamp_seconds=0` in compute_score | Add `timestamp_seconds` to `ComputeScoreRequest` and pass it through | Bug fix |
| `<video>` element in VideoPlayer | YouTube IFrame API | User wants NPTEL YouTube video + playback rate control |
| `attachToVideo(videoElement)` | Add `trackEvent(type, ts)` to useBehavior + wire from YT player callbacks | YouTube has no native video element |
| No EngagementHeatmap spec | Build it as color-coded 30s block grid | User confirmed: build it |
| `slow_video`/`speed_up` action buttons show message | Actually call `player.setPlaybackRate()` | User confirmed: actually change rate |

---

## Task 1: Project Directory Scaffold

**Files:**
- Create: `backend/` with subdirectories
- Create: `frontend/` via Vite CLI

**Step 1: Create backend directories**

```bash
mkdir -p d:/Projects/Empath/backend/models
mkdir -p d:/Projects/Empath/backend/services
mkdir -p d:/Projects/Empath/backend/database
mkdir -p d:/Projects/Empath/backend/schemas
mkdir -p d:/Projects/Empath/backend/tests
```

**Step 2: Scaffold frontend with Vite**

```bash
cd d:/Projects/Empath
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios recharts framer-motion uuid
npm install -D tailwindcss autoprefixer postcss
npx tailwindcss init -p
```

**Step 3: Create frontend subdirectories**

```bash
mkdir -p d:/Projects/Empath/frontend/src/components
mkdir -p d:/Projects/Empath/frontend/src/hooks
mkdir -p d:/Projects/Empath/frontend/src/api
```

**Step 4: Verify**

```bash
ls d:/Projects/Empath/backend/
ls d:/Projects/Empath/frontend/src/
```

Expected: both have correct subdirectory structure.

---

## Task 2: Backend Config Files

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/.env`

**Step 1: Write requirements.txt**

Note: torch is already in the `empath` conda env. Only pip packages needed:

```
fastapi==0.111.0
uvicorn==0.29.0
transformers==4.41.0
Pillow==10.3.0
pydantic==2.7.0
python-multipart==0.0.9
python-dotenv==1.0.1
supabase==2.4.6
numpy==1.26.4
```

**Step 2: Write .env**

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
CORS_ORIGINS=http://localhost:5173
```

**Step 3: Install requirements**

```bash
conda run -n empath pip install -r d:/Projects/Empath/backend/requirements.txt
```

Expected: all packages install without errors.

---

## Task 3: Backend — schemas/schemas.py

**Files:**
- Create: `backend/schemas/__init__.py` (empty)
- Create: `backend/schemas/schemas.py`
- Create: `backend/tests/__init__.py` (empty)
- Test: `backend/tests/test_schemas.py`

**Step 1: Write the failing test**

```python
# backend/tests/test_schemas.py
import sys
sys.path.insert(0, 'd:/Projects/Empath/backend')
from schemas.schemas import BehaviorEventRequest, ComputeScoreRequest, SuggestionRequest

def test_behavior_event_schema():
    req = BehaviorEventRequest(
        session_id="abc-123",
        event_type="pause",
        timestamp_seconds=10.5
    )
    assert req.event_type == "pause"
    assert req.timestamp_seconds == 10.5

def test_compute_score_schema_has_timestamp():
    req = ComputeScoreRequest(
        session_id="abc-123",
        emotion="neutral",
        confidence=0.85,
        recent_events=["pause"],
        timestamp_seconds=30.0
    )
    assert req.timestamp_seconds == 30.0

def test_suggestion_request_schema():
    req = SuggestionRequest(
        session_id="abc-123",
        engagement_state="confused",
        topic="Machine Learning",
        timestamp_seconds=60.0
    )
    assert req.engagement_state == "confused"
```

**Step 2: Run test to verify it fails**

```bash
cd d:/Projects/Empath/backend
conda run -n empath python -m pytest tests/test_schemas.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'schemas'`

**Step 3: Write schemas.py**

```python
# backend/schemas/schemas.py
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
    recent_events: List[str]
    timestamp_seconds: float  # ADDED vs spec — used in save_emotion_event

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

**Step 4: Run test to verify it passes**

```bash
conda run -n empath python -m pytest tests/test_schemas.py -v
```

Expected: 3 PASSED

---

## Task 4: Backend — services/scoring.py

**Files:**
- Create: `backend/services/__init__.py` (empty)
- Create: `backend/services/scoring.py`
- Test: `backend/tests/test_scoring.py`

**Step 1: Write the failing tests**

```python
# backend/tests/test_scoring.py
import sys
sys.path.insert(0, 'd:/Projects/Empath/backend')
from services.scoring import compute_focus_score

def test_focused_no_events():
    result = compute_focus_score("focused", [])
    # emotion_score=90, behavior_score=100
    # focus_score = int(90*0.6 + 100*0.4) = int(54+40) = 94
    assert result["focus_score"] == 94
    assert result["engagement_state"] == "focused"

def test_neutral_no_events():
    result = compute_focus_score("neutral", [])
    # int(70*0.6 + 100*0.4) = int(42+40) = 82
    assert result["focus_score"] == 82
    assert result["engagement_state"] == "focused"

def test_bored_with_rewind():
    result = compute_focus_score("bored", ["rewind"])
    # emotion=30, behavior=max(0,100-15)=85
    # int(30*0.6 + 85*0.4) = int(18+34) = 52
    assert result["focus_score"] == 52
    assert result["engagement_state"] == "neutral"

def test_distressed_many_events():
    result = compute_focus_score("distressed", ["idle_start", "pause", "rewind"])
    # emotion=20, behavior=max(0,100-30-10-15)=45
    # int(20*0.6 + 45*0.4) = int(12+18) = 30
    assert result["focus_score"] == 30
    assert result["engagement_state"] == "bored"

def test_score_clamped_to_100():
    result = compute_focus_score("focused", [])
    assert result["focus_score"] <= 100

def test_score_never_negative():
    result = compute_focus_score("distressed", ["idle_start"] * 10)
    assert result["focus_score"] >= 0
```

**Step 2: Run to verify they fail**

```bash
conda run -n empath python -m pytest tests/test_scoring.py -v
```

Expected: FAIL — `ModuleNotFoundError: No module named 'services'`

**Step 3: Write scoring.py**

```python
# backend/services/scoring.py
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

**Step 4: Run tests**

```bash
conda run -n empath python -m pytest tests/test_scoring.py -v
```

Expected: 6 PASSED

---

## Task 5: Backend — database/db.py

**Files:**
- Create: `backend/database/__init__.py` (empty)
- Create: `backend/database/db.py`

**Step 1: Write db.py** (exact spec code)

```python
# backend/database/db.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_ANON_KEY"]
)
```

**Step 2: Smoke test** (requires .env filled with real credentials)

```bash
cd d:/Projects/Empath/backend
conda run -n empath python -c "from database.db import supabase; print('DB client created:', supabase)"
```

Expected: `DB client created: <supabase.client.Client object ...>`

---

## Task 6: Backend — services/session.py

**Files:**
- Create: `backend/services/session.py`

**Step 1: Write session.py** (exact spec code)

```python
# backend/services/session.py
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

---

## Task 7: Backend — models/emotion_model.py

**Files:**
- Create: `backend/models/__init__.py` (empty)
- Create: `backend/models/emotion_model.py`

**Step 1: Write emotion_model.py**

IMPORTANT: Add `device="cpu"` — empath env has CPU-only PyTorch.

```python
# backend/models/emotion_model.py
from transformers import pipeline
from PIL import Image
import io

emotion_pipeline = None

def load_model():
    global emotion_pipeline
    emotion_pipeline = pipeline(
        "image-classification",
        model="dima806/facial_emotions_image_detection",
        device="cpu"  # CPU-only torch in empath conda env
    )

def analyze_frame(image_bytes: bytes) -> dict:
    """
    Takes raw JPEG bytes from webcam frame.
    Returns { emotion: str, confidence: float }
    Maps dima806 labels to our 5 engagement states.
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    results = emotion_pipeline(image)
    top = results[0]

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

**Step 2: Smoke test** (downloads ~100MB model on first run)

```bash
cd d:/Projects/Empath/backend
conda run -n empath python -c "
from models.emotion_model import load_model
load_model()
print('Emotion model loaded OK')
"
```

Expected: Downloads model, prints `Emotion model loaded OK`

---

## Task 8: Backend — models/suggestion_model.py

**Files:**
- Create: `backend/models/suggestion_model.py`

**Step 1: Write suggestion_model.py**

IMPORTANT: Add `device="cpu"`.

```python
# backend/models/suggestion_model.py
from transformers import pipeline

suggestion_pipeline = None

ACTION_MAP = {
    "confused": "slow_video",
    "bored": "speed_up",
    "distressed": "show_break",
    "neutral": "nudge",
    "focused": "none"
}

def load_model():
    global suggestion_pipeline
    suggestion_pipeline = pipeline(
        "text2text-generation",
        model="google/flan-t5-base",
        max_new_tokens=80,
        device="cpu"  # CPU-only torch in empath conda env
    )

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

**Step 2: Smoke test** (downloads ~1GB flan-t5-base on first run)

```bash
cd d:/Projects/Empath/backend
conda run -n empath python -c "
from models.suggestion_model import load_model, generate_suggestion
load_model()
r = generate_suggestion('bored', 'machine learning')
print('Suggestion:', r)
"
```

Expected: Downloads model, prints a suggestion dict with `suggestion` and `action` keys.

---

## Task 9: Backend — main.py

**Files:**
- Create: `backend/main.py`

**Deviations from spec:**
- Pass `req.timestamp_seconds` to `save_emotion_event` (not `0`)

**Step 1: Write main.py**

```python
# backend/main.py
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
    print("Loading HuggingFace models... (20-30s on first run)")
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
        req.timestamp_seconds,  # FIXED: was 0 in spec
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

**Step 2: Run all backend tests**

```bash
cd d:/Projects/Empath/backend
conda run -n empath python -m pytest tests/ -v
```

Expected: All tests pass (schemas + scoring).

**Step 3: Start server and verify health endpoint**

```bash
cd d:/Projects/Empath/backend
conda run -n empath uvicorn main:app --reload --port 8000
```

In a separate terminal after server starts:

```bash
curl http://localhost:8000/api/health
```

Expected: `{"models_ready":false}` immediately, then `{"models_ready":true}` after ~30 seconds.

---

## Task 10: Frontend — Config Files

**Files:**
- Modify: `frontend/vite.config.js`
- Modify: `frontend/tailwind.config.js`
- Create: `frontend/.env`
- Modify: `frontend/index.html`
- Modify: `frontend/src/index.css`

**Step 1: Update vite.config.js**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 }
})
```

**Step 2: Update tailwind.config.js**

```javascript
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'sans-serif'] }
    }
  },
  plugins: []
}
```

**Step 3: Create frontend/.env**

```
VITE_API_URL=http://localhost:8000
```

**Step 4: Update index.html — add Inter font to `<head>`**

Add this line inside `<head>`:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Step 5: Replace src/index.css content**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #0F172A;
  font-family: 'Inter', sans-serif;
}
```

**Step 6: Replace src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## Task 11: Frontend — api/empathApi.js

**Files:**
- Create: `frontend/src/api/empathApi.js`

**Step 1: Write empathApi.js** (exact spec code)

```javascript
// frontend/src/api/empathApi.js
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

---

## Task 12: Frontend — hooks/useWebcam.js

**Files:**
- Create: `frontend/src/hooks/useWebcam.js`

**Step 1: Write useWebcam.js** (exact spec code)

```javascript
// frontend/src/hooks/useWebcam.js
import { useRef, useEffect, useState, useCallback } from 'react'
import { analyzeEmotion } from '../api/empathApi'

export function useWebcam() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
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
      }, 'image/jpeg', 0.7)
    }, 5000)
  }, [hasPermission])

  const stopCapturing = useCallback(() => {
    clearInterval(intervalRef.current)
  }, [])

  return { videoRef, canvasRef, emotion, confidence, hasPermission, startCapturing, stopCapturing }
}
```

---

## Task 13: Frontend — hooks/useBehavior.js

**Files:**
- Create: `frontend/src/hooks/useBehavior.js`

**Key deviation:** Add `trackEvent(type, ts)` export so App.jsx can feed YouTube IFrame API events into the same behavior tracking system. `attachToVideo` is kept for native video fallback.

```javascript
// frontend/src/hooks/useBehavior.js
import { useRef, useCallback } from 'react'
import { sendBehaviorEvent } from '../api/empathApi'

export function useBehavior(sessionId) {
  const eventsRef = useRef([])
  const lastSeekTime = useRef(null)
  const idleTimerRef = useRef(null)
  const videoRef = useRef(null)

  // Core event tracker — used by both attachToVideo and trackEvent
  const send = useCallback((type, ts) => {
    eventsRef.current.push(type)
    if (eventsRef.current.length > 20) eventsRef.current.shift()
    sendBehaviorEvent({
      session_id: sessionId,
      event_type: type,
      timestamp_seconds: ts
    }).catch(() => {}) // fire-and-forget
  }, [sessionId])

  const resetIdleTimer = useCallback((ts) => {
    clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      send('idle_start', ts || 0)
    }, 30000)
  }, [send])

  // For YouTube IFrame API — called from App.jsx player callbacks
  const trackEvent = useCallback((type, ts) => {
    send(type, ts)
    if (type === 'play') resetIdleTimer(ts)
  }, [send, resetIdleTimer])

  // For native <video> element (fallback)
  const attachToVideo = useCallback((videoElement) => {
    videoRef.current = videoElement
    if (!videoElement) return

    videoElement.addEventListener('pause', () => send('pause', videoElement.currentTime))
    videoElement.addEventListener('play', () => {
      send('play', videoElement.currentTime)
      resetIdleTimer(videoElement.currentTime)
    })
    videoElement.addEventListener('seeked', () => {
      const seekDir = videoElement.currentTime < (lastSeekTime.current || 0) ? 'rewind' : 'fast_forward'
      send(seekDir, videoElement.currentTime)
      lastSeekTime.current = videoElement.currentTime
    })
    videoElement.addEventListener('ratechange', () => send('rate_change', videoElement.currentTime))

    document.addEventListener('mousemove', () => resetIdleTimer(videoElement.currentTime))
    document.addEventListener('keydown', () => resetIdleTimer(videoElement.currentTime))
  }, [send, resetIdleTimer])

  const getRecentEvents = useCallback(() => [...eventsRef.current], [])

  return { attachToVideo, trackEvent, getRecentEvents }
}
```

---

## Task 14: Frontend — hooks/useEngagement.js

**Files:**
- Create: `frontend/src/hooks/useEngagement.js`

**Step 1: Write useEngagement.js** (exact spec code)

```javascript
// frontend/src/hooks/useEngagement.js
import { useState, useRef, useCallback } from 'react'
import { computeScore, getSuggestion } from '../api/empathApi'

export function useEngagement(sessionId, topic = 'General') {
  const [focusScore, setFocusScore] = useState(80)
  const [engagementState, setEngagementState] = useState('focused')
  const [suggestion, setSuggestion] = useState(null)
  const [timeline, setTimeline] = useState([])
  const lastStateRef = useRef('focused')

  const updateEngagement = useCallback(async (emotion, confidence, recentEvents, timestampSeconds) => {
    try {
      const scoreResult = await computeScore({
        session_id: sessionId,
        emotion,
        confidence,
        recent_events: recentEvents,
        timestamp_seconds: timestampSeconds || Date.now() / 1000
      })

      setFocusScore(scoreResult.focus_score)
      setEngagementState(scoreResult.engagement_state)
      setTimeline(prev => [...prev, {
        time: Date.now(),
        score: scoreResult.focus_score,
        emotion
      }])

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
          timestamp_seconds: timestampSeconds || Date.now() / 1000
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

---

## Task 15: Frontend — VideoPlayer.jsx

**Files:**
- Create: `frontend/src/components/VideoPlayer.jsx`

Uses YouTube IFrame API. `onPlayerReady` callback gives App.jsx the player object for playback rate control.

```jsx
// frontend/src/components/VideoPlayer.jsx
import { useEffect, useRef } from 'react'

// NPTEL ML lecture: https://www.youtube.com/watch?v=aircAruvnKk
// Replace with actual NPTEL video ID if needed
const YOUTUBE_VIDEO_ID = 'aircAruvnKk'

export default function VideoPlayer({ onPlayerReady, onStateChange }) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    const initPlayer = () => {
      if (!containerRef.current) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: YOUTUBE_VIDEO_ID,
        width: '100%',
        height: '360',
        playerVars: { controls: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => onPlayerReady && onPlayerReady(e.target),
          onStateChange: (e) => onStateChange && onStateChange(e)
        }
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      // Load YouTube IFrame API script once
      if (!document.getElementById('yt-iframe-api')) {
        const tag = document.createElement('script')
        tag.id = 'yt-iframe-api'
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [])

  return (
    <div className="rounded-xl overflow-hidden bg-slate-800 shadow-lg">
      <div ref={containerRef} />
    </div>
  )
}
```

---

## Task 16: Frontend — WebcamCapture.jsx

**Files:**
- Create: `frontend/src/components/WebcamCapture.jsx`

```jsx
// frontend/src/components/WebcamCapture.jsx
const EMOTION_EMOJI = {
  focused: '😊',
  neutral: '😐',
  confused: '😕',
  bored: '😴',
  distressed: '😰'
}

export default function WebcamCapture({ webcamRef, canvasRef, emotion, hasPermission }) {
  return (
    <div className="bg-slate-800 rounded-xl p-4">
      {hasPermission ? (
        <div className="flex items-center gap-4">
          <div className="w-40 h-30 rounded-lg overflow-hidden bg-black flex-shrink-0">
            <video
              ref={webcamRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ height: '120px' }}
            />
          </div>
          <div className="text-center">
            <div className="text-4xl">{EMOTION_EMOJI[emotion] || '😐'}</div>
            <div className="text-slate-300 text-sm capitalize mt-1">{emotion}</div>
            <div className="text-slate-500 text-xs mt-1">Live Emotion</div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-slate-400 py-2">
          <span className="text-2xl">📷</span>
          <span className="text-sm">Webcam unavailable — behavior tracking active</span>
        </div>
      )}
      {/* Hidden canvas for frame capture — must be in DOM */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
```

---

## Task 17: Frontend — FocusScoreGauge.jsx

**Files:**
- Create: `frontend/src/components/FocusScoreGauge.jsx`

```jsx
// frontend/src/components/FocusScoreGauge.jsx
import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

const STATE_COLOR = {
  focused: '#22C55E',
  neutral: '#EAB308',
  confused: '#F97316',
  bored: '#EF4444',
  distressed: '#DC2626'
}

const STATE_LABEL = {
  focused: 'Focused',
  neutral: 'Neutral',
  confused: 'Confused',
  bored: 'Bored',
  distressed: 'Distressed'
}

export default function FocusScoreGauge({ score, state }) {
  const color = STATE_COLOR[state] || '#3B82F6'
  const data = [{ value: score, fill: color }]

  return (
    <div className="bg-slate-800 rounded-xl p-6 flex flex-col items-center">
      <h3 className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">Focus Score</h3>
      <div className="relative">
        <RadialBarChart
          width={200}
          height={200}
          cx={100}
          cy={100}
          innerRadius={70}
          outerRadius={90}
          startAngle={180}
          endAngle={-180}
          data={data}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: '#334155' }}
            dataKey="value"
            angleAxisId={0}
            cornerRadius={10}
          />
        </RadialBarChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-4xl font-bold transition-all duration-500"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-slate-400 text-xs capitalize mt-1">
            {STATE_LABEL[state] || state}
          </span>
        </div>
      </div>
    </div>
  )
}
```

---

## Task 18: Frontend — EmotionTimeline.jsx

**Files:**
- Create: `frontend/src/components/EmotionTimeline.jsx`

```jsx
// frontend/src/components/EmotionTimeline.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts'

export default function EmotionTimeline({ timeline }) {
  const data = timeline.map((entry, i) => ({
    time: `${i * 5}s`,
    score: entry.score,
    emotion: entry.emotion
  }))

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <h3 className="text-slate-400 text-xs font-medium mb-4 uppercase tracking-wider">Focus Timeline</h3>
      {data.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-8">
          Waiting for first reading...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94A3B8" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8 }}
              labelStyle={{ color: '#F8FAFC' }}
              itemStyle={{ color: '#94A3B8' }}
            />
            <ReferenceLine
              y={80}
              stroke="#22C55E"
              strokeDasharray="4 4"
              label={{ value: 'Focused', fill: '#22C55E', fontSize: 9, position: 'right' }}
            />
            <ReferenceLine
              y={50}
              stroke="#EF4444"
              strokeDasharray="4 4"
              label={{ value: 'Alert', fill: '#EF4444', fontSize: 9, position: 'right' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: '#3B82F6', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
```

---

## Task 19: Frontend — SuggestionCard.jsx

**Files:**
- Create: `frontend/src/components/SuggestionCard.jsx`

Action buttons call `playerRef.current.setPlaybackRate()` — actually changes YouTube video speed.

```jsx
// frontend/src/components/SuggestionCard.jsx
import { useEffect } from 'react'
import { motion } from 'framer-motion'

const ACTION_LABELS = {
  slow_video: '🐢 Slow Down Video',
  speed_up: '⚡ Speed Up',
  show_quiz: '📝 Quick Quiz',
  show_break: '☕ Take a Break',
  nudge: '👍 Got It',
  none: '✓ Dismiss'
}

export default function SuggestionCard({ suggestion, onDismiss, playerRef }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 10000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const handleAction = () => {
    const player = playerRef?.current
    try {
      if (suggestion.action === 'slow_video' && player) {
        player.setPlaybackRate(0.75)
      } else if (suggestion.action === 'speed_up' && player) {
        player.setPlaybackRate(1.5)
      } else if (suggestion.action === 'show_break' && player) {
        player.pauseVideo()
      }
    } catch (err) {
      console.warn('Could not control player:', err)
    }
    onDismiss()
  }

  return (
    <motion.div
      initial={{ x: 120, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 120, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-6 right-6 bg-slate-800 border border-blue-500/50 rounded-2xl p-5 max-w-sm shadow-2xl z-50 w-80"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">
          Empath Suggestion
        </span>
        <button
          onClick={onDismiss}
          className="text-slate-500 hover:text-white text-lg leading-none ml-2"
        >
          ×
        </button>
      </div>
      <p className="text-white text-sm leading-relaxed mb-4">{suggestion.suggestion}</p>
      <div className="flex gap-2">
        <button
          onClick={handleAction}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          {ACTION_LABELS[suggestion.action] || '✓ OK'}
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors text-slate-300"
        >
          Later
        </button>
      </div>
    </motion.div>
  )
}
```

---

## Task 20: Frontend — EngagementHeatmap.jsx

**Files:**
- Create: `frontend/src/components/EngagementHeatmap.jsx`

30-second blocks (6 × 5-second readings each), colored by average focus score.

```jsx
// frontend/src/components/EngagementHeatmap.jsx

const scoreToColor = (score) => {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#84CC16'
  if (score >= 40) return '#EAB308'
  if (score >= 20) return '#F97316'
  return '#EF4444'
}

const scoreToLabel = (score) => {
  if (score >= 80) return 'Focused'
  if (score >= 60) return 'Neutral'
  if (score >= 40) return 'Confused'
  if (score >= 20) return 'Bored'
  return 'Distressed'
}

export default function EngagementHeatmap({ timeline }) {
  // Group into 30-second blocks (6 readings × 5s each)
  const blocks = []
  for (let i = 0; i < timeline.length; i += 6) {
    const chunk = timeline.slice(i, i + 6)
    const avg = Math.round(chunk.reduce((sum, e) => sum + e.score, 0) / chunk.length)
    blocks.push({ avg, startTime: i * 5 })
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <h3 className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wider">
        Engagement Heatmap
      </h3>
      {blocks.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-4">Building heatmap...</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {blocks.map((block, i) => (
            <div
              key={i}
              title={`${block.startTime}–${block.startTime + 30}s: ${block.avg} (${scoreToLabel(block.avg)})`}
              className="w-8 h-8 rounded cursor-pointer transition-transform hover:scale-125 hover:z-10 relative"
              style={{ backgroundColor: scoreToColor(block.avg) }}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500 inline-block" /> Focused
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500 inline-block" /> Neutral
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-500 inline-block" /> Struggling
        </span>
      </div>
    </div>
  )
}
```

---

## Task 21: Frontend — SessionReport.jsx

**Files:**
- Create: `frontend/src/components/SessionReport.jsx`

```jsx
// frontend/src/components/SessionReport.jsx
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

const EMOTION_COLORS = {
  focused: '#22C55E',
  neutral: '#94A3B8',
  confused: '#F97316',
  bored: '#EAB308',
  distressed: '#EF4444'
}

export default function SessionReport({ report }) {
  const pieData = Object.entries(report.emotion_distribution || {}).map(([name, value]) => ({
    name, value
  }))

  const timelineData = (report.focus_timeline || []).map((e, i) => ({
    time: `${Math.round(e.t)}s`,
    score: e.score,
    emotion: e.emotion
  }))

  const keyMoments = (report.focus_timeline || []).filter(e => e.score < 50)

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-400 mb-1">Session Report</h1>
        <p className="text-slate-500 text-sm mb-8">Session: {report.session_id}</p>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-blue-400">{report.average_focus_score}</div>
            <div className="text-slate-400 text-sm mt-1">Avg Focus Score</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-green-400">{report.total_events}</div>
            <div className="text-slate-400 text-sm mt-1">Behavior Events</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-yellow-400">
              {report.suggestions_given?.length || 0}
            </div>
            <div className="text-slate-400 text-sm mt-1">Suggestions Given</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Emotion Distribution Pie */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-slate-300 font-semibold mb-4">Emotion Distribution</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={EMOTION_COLORS[entry.name] || '#3B82F6'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1E293B', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm text-center py-12">No emotion data</div>
            )}
          </div>

          {/* Focus Over Time Line */}
          <div className="bg-slate-800 rounded-xl p-6">
            <h2 className="text-slate-300 font-semibold mb-4">Focus Over Time</h2>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" stroke="#94A3B8" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#94A3B8" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: '#1E293B', border: 'none' }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500 text-sm text-center py-12">No timeline data</div>
            )}
          </div>
        </div>

        {/* Key Moments */}
        {keyMoments.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-slate-300 font-semibold mb-3">Key Moments</h2>
            <ul className="space-y-2">
              {keyMoments.map((e, i) => (
                <li key={i} className="text-sm text-slate-400 flex items-center gap-2">
                  <span className="text-blue-400 font-mono">@{Math.round(e.t)}s</span>
                  <span>—</span>
                  <span>You appeared</span>
                  <span className="text-yellow-400 font-medium">{e.emotion}</span>
                  <span className="text-slate-500">(score: {e.score})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions given */}
        {report.suggestions_given?.length > 0 && (
          <div className="bg-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-slate-300 font-semibold mb-3">Suggestions Given</h2>
            <ul className="space-y-3">
              {report.suggestions_given.map((s, i) => (
                <li key={i} className="text-sm text-slate-400 bg-slate-700/50 rounded-lg p-3">
                  <span className="text-blue-400 font-mono mr-2">@{Math.round(s.timestamp_seconds)}s</span>
                  {s.suggestion_text}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-lg transition-colors"
        >
          Start New Session
        </button>
      </div>
    </div>
  )
}
```

---

## Task 22: Frontend — App.jsx

**Files:**
- Modify: `frontend/src/App.jsx`

**Key wiring:**
- `playerRef` is a ref to the YouTube `YT.Player` object — passed to `VideoPlayer` via `onPlayerReady`, and to `SuggestionCard` for playback rate control
- YouTube state changes (play/pause/seek) call `trackEvent()` from `useBehavior`
- `useWebcam.startCapturing` callback calls `updateEngagement` with timestamp

```jsx
// frontend/src/App.jsx
import { useState, useEffect, useRef } from 'react'
import { checkHealth, startSession, endSession, getSessionReport } from './api/empathApi'
import VideoPlayer from './components/VideoPlayer'
import WebcamCapture from './components/WebcamCapture'
import FocusScoreGauge from './components/FocusScoreGauge'
import EmotionTimeline from './components/EmotionTimeline'
import SuggestionCard from './components/SuggestionCard'
import EngagementHeatmap from './components/EngagementHeatmap'
import SessionReport from './components/SessionReport'
import { useWebcam } from './hooks/useWebcam'
import { useBehavior } from './hooks/useBehavior'
import { useEngagement } from './hooks/useEngagement'

// YouTube IFrame API player state codes
const YT_STATES = { PLAYING: 1, PAUSED: 2, ENDED: 0, BUFFERING: 3 }

export default function App() {
  const [sessionId, setSessionId] = useState(null)
  const [modelsReady, setModelsReady] = useState(false)
  const [sessionEnded, setSessionEnded] = useState(false)
  const [report, setReport] = useState(null)
  const playerRef = useRef(null)  // YouTube YT.Player instance
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

  // Start session once models are ready
  useEffect(() => {
    if (!modelsReady) return
    startSession({ topic }).then(({ session_id }) => setSessionId(session_id))
  }, [modelsReady])

  const {
    videoRef: webcamRef, canvasRef, emotion, confidence,
    hasPermission, startCapturing, stopCapturing
  } = useWebcam()

  const { trackEvent, getRecentEvents } = useBehavior(sessionId)

  const {
    focusScore, engagementState, suggestion, timeline,
    updateEngagement, dismissSuggestion
  } = useEngagement(sessionId, topic)

  // YouTube player ready callback — store player ref
  const handlePlayerReady = (player) => {
    playerRef.current = player
  }

  // YouTube state change → behavior tracking
  const handleYTStateChange = (event) => {
    if (!sessionId || !playerRef.current) return
    const ts = playerRef.current.getCurrentTime?.() || 0
    const state = event.data
    if (state === YT_STATES.PLAYING) trackEvent('play', ts)
    else if (state === YT_STATES.PAUSED) trackEvent('pause', ts)
  }

  // Start webcam emotion capturing after session starts
  useEffect(() => {
    if (!sessionId || !modelsReady) return
    startCapturing((emotionResult) => {
      const ts = playerRef.current?.getCurrentTime?.() || Date.now() / 1000
      updateEngagement(emotionResult.emotion, emotionResult.confidence, getRecentEvents(), ts)
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

  // Loading screen
  if (!modelsReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-xl font-semibold">Loading AI Models...</p>
          <p className="text-slate-400 text-sm mt-2">This takes ~30 seconds on first run</p>
        </div>
      </div>
    )
  }

  // Session report screen
  if (sessionEnded && report) {
    return <SessionReport report={report} />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-400">Project Empath</h1>
            <p className="text-slate-500 text-sm">Adaptive Learning — {topic}</p>
          </div>
          <button
            onClick={handleEndSession}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm transition-colors"
          >
            End Session
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Panel */}
          <div className="space-y-4">
            <VideoPlayer
              onPlayerReady={handlePlayerReady}
              onStateChange={handleYTStateChange}
            />
            <WebcamCapture
              webcamRef={webcamRef}
              canvasRef={canvasRef}
              emotion={emotion}
              hasPermission={hasPermission}
            />
          </div>

          {/* Right Panel */}
          <div className="space-y-4">
            <FocusScoreGauge score={focusScore} state={engagementState} />
            <EmotionTimeline timeline={timeline} />
            <EngagementHeatmap timeline={timeline} />
          </div>
        </div>
      </div>

      {/* Suggestion overlay */}
      {suggestion && (
        <SuggestionCard
          suggestion={suggestion}
          onDismiss={dismissSuggestion}
          playerRef={playerRef}
        />
      )}
    </div>
  )
}
```

---

## Task 23: Final Integration Test

**Step 1: Fill in .env with real Supabase credentials**

Edit `d:/Projects/Empath/backend/.env`:
```
SUPABASE_URL=https://your-actual-project.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key
CORS_ORIGINS=http://localhost:5173
```

**Step 2: Start backend** (in terminal 1)

```bash
cd d:/Projects/Empath/backend
conda activate empath
uvicorn main:app --reload --port 8000
```

Wait for: `Models ready.` in terminal output (~30 seconds).

**Step 3: Start frontend** (in terminal 2)

```bash
cd d:/Projects/Empath/frontend
npm run dev
```

Open: http://localhost:5173

**Step 4: Verify MVP checklist**

- [ ] Loading spinner appears while models load
- [ ] Spinner disappears when models are ready (polls /api/health every 2s)
- [ ] YouTube video plays in VideoPlayer
- [ ] Webcam preview shows (or fallback message if denied)
- [ ] FocusScoreGauge shows score (initially 80)
- [ ] EmotionTimeline starts populating after 5 seconds
- [ ] EngagementHeatmap shows colored blocks as data accumulates
- [ ] Supabase: check `emotion_events` table has rows
- [ ] Supabase: check `behavior_events` table has rows after pause/play
- [ ] Suggestion card appears when score drops below 50
- [ ] Action buttons change YouTube playback rate
- [ ] Suggestion auto-dismisses after 10 seconds
- [ ] End Session button shows session report
- [ ] Session report shows avg score, emotion pie chart, timeline, key moments
- [ ] "Start New Session" reloads the app

---

## Definition of Done

All 16 MVP checklist items pass. Backend runs without errors in `empath` conda env. Frontend displays real-time engagement data from webcam + YouTube behavior events.
