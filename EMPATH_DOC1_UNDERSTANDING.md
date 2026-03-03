# Project Empath — Understanding the Problem & Solution
### Your Complete Guide to What You're Building and Why

---

## 1. The Problem — In Plain English

Imagine a classroom of 30 students watching the same video lecture. One student is deeply confused at minute 4:30. Another is bored. A third has quietly zoned out. The platform keeps playing. No awareness. No response. No help.

**This is the crisis Empath solves.**

Digital learning platforms measure *completion* — did the video finish? — but never *comprehension* or *engagement*. A student can watch 45 minutes of content in total confusion and the platform awards them a green checkmark.

### The 4 Core Pain Points

    ┌─────────────────────────────────────────────────────────────────┐
    │  PAIN POINT 1: INVISIBLE DISENGAGEMENT                          │
    │  Platform cannot detect if you're focused, confused, or asleep. │
    └─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │  PAIN POINT 2: ONE-SIZE-FITS-ALL DELIVERY                       │
    │  Same speed. Same difficulty. Same format. For every student.   │
    └─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │  PAIN POINT 3: NO REAL-TIME INTERVENTION                        │
    │  Problems caught only AFTER the lesson, in test scores.         │
    └─────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────┐
    │  PAIN POINT 4: NO FEEDBACK LOOP                                 │
    │  System doesn't learn. Each session starts from zero.           │
    └─────────────────────────────────────────────────────────────────┘

---

## 2. The Solution — What Empath Does

Empath is an Emotion-Aware Adaptive Learning Assistant. It does four things simultaneously during any video learning session:

1. Watches the student's face (webcam) to detect emotional state
2. Tracks how the student interacts with the video (behavior signals)
3. Computes a real-time Focus Score (0–100) from both signals
4. Intervenes with personalized suggestions when engagement drops

The key insight: **Empath acts in the moment, not after.** Confusion at minute 4:30 is met with help at minute 4:30 — not next week's failed quiz.

---

## 3. The Two Detection Engines

### Engine 1 — Facial Emotion Detection

    Webcam
      │ [Frame captured every 5 seconds]
      ▼
    Canvas Element (hidden in browser)
      │ [JPEG compressed, 0.7 quality]
      ▼
    FastAPI Backend — POST /api/analyze-emotion
      │ [HuggingFace: dima806/facial_emotions_image_detection]
      │ [Runs LOCALLY — no data leaves your server]
      ▼
    Returns: { emotion: "confused", confidence: 0.87 }

**Privacy by design:** No webcam data ever reaches a third-party server. Frames are processed on your FastAPI backend and immediately discarded.

### Engine 2 — Behavioral Engagement Tracking

    Video Player Events:
      pause          → possible confusion or distraction
      rewind/seek-back → strong confusion signal ("I didn't get that")
      fast-forward   → boredom signal ("I know this already")
      idle > 30s     → disengagement (no mouse/keyboard activity)
      rate change    → deliberate state shift
      │
      │ [Sent to POST /api/behavior-event in real time]
      ▼
    Behavior Score (feeds into Focus Score)

**Why both engines?** Facial detection has edge cases (lighting, angles). Behavioral signals are always available. Together they produce a far more accurate picture than either alone.

---

## 4. The Focus Score

    ┌────────────────────────────────────────────────────────────┐
    │  Focus Score = (Emotion Score × 0.6) + (Behavior × 0.4)   │
    │                                                            │
    │  Emotion → Score mapping:                                  │
    │    focused    → 90                                         │
    │    neutral    → 70                                         │
    │    confused   → 50                                         │
    │    bored      → 30                                         │
    │    distressed → 20                                         │
    │                                                            │
    │  Behavior modifiers (last 60s):                            │
    │    No events (steady watching)  → baseline                 │
    │    pause                        → -10                      │
    │    rewind                       → -15                      │
    │    fast-forward                 → -20                      │
    │    idle > 30s                   → -30                      │
    │                                                            │
    │  Thresholds:                                               │
    │    80–100 → FOCUSED    (green, no intervention)            │
    │    60–79  → NEUTRAL    (yellow, monitor)                   │
    │    40–59  → CONFUSED   (orange, offer help)                │
    │    20–39  → BORED      (red-orange, adapt)                 │
    │    0–19   → DISTRESSED (red, pause + check-in)             │
    └────────────────────────────────────────────────────────────┘

Updates every 5 seconds. Drives all adaptive decisions.

---

## 5. The Adaptive Engine

When Focus Score drops below 50, `google/flan-t5-base` generates a personalized suggestion:

    CONFUSED (40–59)
      → Slow video to 0.75x
      → Show summary card of last 2 minutes
      → Recommend simpler supplementary resource

    BORED (20–39)
      → Speed up to 1.25x
      → Suggest skipping ahead
      → Trigger a challenge quiz

    DISTRESSED (0–19)
      → Pause video immediately
      → Show calming message
      → Suggest 5-minute break

    DISENGAGED (idle detected)
      → Gentle nudge: "Still with us?"

    FOCUSED (80–100)
      → Do absolutely nothing (preserve flow state)

---

## 6. Full System Architecture

    ┌──────────────────────────────────────────────────────────────┐
    │                    BROWSER (React)                           │
    │                                                              │
    │  VideoPlayer.jsx     WebcamCapture.jsx     Dashboard Panel   │
    │  + useBehavior       + useWebcam           FocusGauge        │
    │  + useEngagement                           EmotionTimeline   │
    │        │                   │               SuggestionCard    │
    │        │ behavior events   │ JPEG frames (every 5s)          │
    └────────┼───────────────────┼──────────────────────────────────┘
             │                   │
             ▼                   ▼
    ┌──────────────────────────────────────────────────────────────┐
    │                  FastAPI Backend (Python)                    │
    │                                                              │
    │  POST /api/behavior-event    POST /api/analyze-emotion       │
    │         │                           │                        │
    │  services/session.py       models/emotion_model.py           │
    │  (store in Supabase)       (dima806/facial_emotions...)      │
    │         │                           │                        │
    │         └──────────┬────────────────┘                        │
    │                    ▼                                         │
    │          POST /api/compute-score                             │
    │          services/scoring.py → Focus Score + State           │
    │                    │                                         │
    │                    ▼ (if score < 50)                         │
    │          POST /api/get-suggestion                            │
    │          models/suggestion_model.py (flan-t5-base)           │
    │          → suggestion text + action type                     │
    │                    │                                         │
    │          GET /api/session-report/{session_id}                │
    └────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
    ┌──────────────────────────────────────────────────────────────┐
    │               Supabase (PostgreSQL)                          │
    │                                                              │
    │  sessions  │  emotion_events  │  behavior_events             │
    │  suggestions (feedback loop data for future sessions)        │
    └──────────────────────────────────────────────────────────────┘

---

## 7. The Database — Supabase (Why, Not SQLite)

| | SQLite | Supabase |
|--|--------|----------|
| Persistence across deploys | ❌ Dies on restart | ✅ Cloud hosted |
| Web dashboard | ❌ None | ✅ Full UI to inspect data |
| Real-time subscriptions | ❌ | ✅ Built in |
| Python client | Basic | `supabase-py` — 1 line inserts |
| Free tier | Local only | ✅ Generous free tier |

### Tables

    sessions
      id (UUID PK) | student_id | video_id | topic | started_at | ended_at

    emotion_events
      id (UUID PK) | session_id (FK) | timestamp | emotion | confidence | focus_score

    behavior_events
      id (UUID PK) | session_id (FK) | timestamp | event_type

    suggestions
      id (UUID PK) | session_id (FK) | timestamp | engagement_state
      suggestion_text | action | was_acted_on

---

## 8. Dashboard Layout

    ┌─────────────────────────────────────────────────────────────┐
    │ LEFT                         │ RIGHT                        │
    │                              │                              │
    │  ┌──────────────────────┐    │  ┌──────────────────────┐   │
    │  │   VIDEO PLAYER       │    │  │  FOCUS SCORE GAUGE   │   │
    │  │                      │    │  │       [ 78 ]         │   │
    │  │                      │    │  │    ●●●●●●●○○○        │   │
    │  └──────────────────────┘    │  └──────────────────────┘   │
    │                              │                              │
    │  ┌──────────────────────┐    │  ┌──────────────────────┐   │
    │  │  📷 WEBCAM PREVIEW   │    │  │  EMOTION TIMELINE    │   │
    │  │  Emotion: Neutral    │    │  │  (recharts line)     │   │
    │  └──────────────────────┘    │  └──────────────────────┘   │
    └─────────────────────────────────────────────────────────────┘

          ┌───────────────────────────────────────────────┐
          │  💡 SUGGESTION CARD (slides in bottom-right)  │
          │  "You seem confused. Here's a quick recap."   │
          │  [View Recap]  [Take Break]  [Dismiss]        │
          └───────────────────────────────────────────────┘

---

## 9. The Feedback Loop

Every session stored in Supabase builds a student profile:
- When during sessions they typically lose focus
- Which topics trigger confusion
- Which interventions they actually acted on
- What formats they engage with best

Future sessions pre-adjust based on this history.

---

## 10. What Claude Code Will Build (Sequence)

    1.  Supabase project setup + all 4 tables via SQL
    2.  FastAPI scaffold with all 5 routes
    3.  HuggingFace models loaded at startup (/api/health check)
    4.  scoring.py — Focus Score formula
    5.  suggestion_model.py — flan-t5 with prompt templates
    6.  React + Vite frontend scaffold
    7.  useWebcam hook — frame capture every 5s
    8.  useBehavior hook — video event tracking
    9.  useEngagement hook — polls backend, manages state
    10. UI components: Gauge, Timeline, SuggestionCard, Report
    11. empathApi.js — all axios calls
    12. App.jsx — wires everything together
    13. End-to-end test: webcam → backend → score → suggestion → UI