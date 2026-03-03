# Empath Frontend Design Document

**Date:** 2026-03-03
**Reference:** 10X Designers (10xdesigners.co) — dark premium EdTech aesthetic

---

## Design Language

### Colors
```
Background:      #141414  (deep near-black)
Surface cards:   #1E1E1E
Border/divider:  #2A2A2A
Text primary:    #FFFFFF
Text secondary:  #888888
Text muted:      #555555

Emotion colors (pill accents):
  focused:    #4ADE80  (bright green)
  neutral:    #FACC15  (yellow)
  confused:   #FB923C  (orange)
  bored:      #F472B6  (pink)
  distressed: #F87171  (red)

Warning red:     #EF4444
```

### Typography
- **Font**: Inter (Google Fonts)
- **Headlines**: 700–800 weight, tight tracking
- **Body**: 400–500 weight
- **Sizes**: 64px hero, 40px section, 24px card title, 16px body, 14px meta

### Component Patterns (from reference)
- **Pill buttons**: white border, dark fill, rounded-full, hover fills white
- **Cards**: `#1E1E1E` bg, `#2A2A2A` border, 12–16px border-radius
- **Floating pills**: colored bg, white text, small, pill-shaped — used for emotion labels, status, badges
- **Stat counters**: 80px white number, 16px gray label below
- **No shadows** — depth via background color contrast only
- **Animations**: Framer Motion — float (y: ±12px, 3s ease), fade-in-up on scroll, spring on state change

---

## Pages

### Page 1 — Landing (`/`)

**Hero** (100vh, dark bg)
- Left/right: floating SVG shapes (brain outline, eye, neural node, waveform) — CSS 3D transforms, slowly rotate
- Floating emotion pills animate in from edges: `● focused`, `● neutral`, `● bored` — drift with Framer Motion
- Center content (max-w-2xl, centered):
  - Badge: `[ AI-Powered Learning ]` — white outline pill
  - H1: "Learn Smarter." (64px, 800 weight)
  - H2: "Empath reads your emotions in real time and adapts your learning experience." (18px, gray)
  - CTA: `Start Learning →` — white border pill button, large
  - Trust strip below: "Used by learners at [logos/institution names]"

**Features** (3-column card grid)
- Card 1 — Emotion Detection: brain icon, "Reads 5 emotional states from your face every 2 seconds"
- Card 2 — Focus Score: gauge icon, "Real-time 0–100 score from emotion + behavior signals"
- Card 3 — Smart Interventions: lightbulb icon, "AI suggests pauses, rewinds, or breaks when you lose focus"

**How It Works** (3 steps, horizontal)
- Step 1: "Open a video" → Step 2: "Empath watches you" → Step 3: "Get personalized nudges"
- Large step numbers (bold, low opacity), icon + title + description

**Stats** (4 counters, full-width dark band)
- `5` Emotions Tracked | `2s` Update Interval | `3` AI Models | `100%` Local & Private

**CTA Section** (centered, lots of vertical space)
- "Ready to actually focus?" (40px)
- `Begin Session →` pill button
- Floating 3D-style shapes in background

**Footer** (dark, 2-column)
- Left: Empath logo + tagline + social links
- Right: links (About, GitHub, Report Issue)

---

### Page 2 — Quick Start (`/start`)

Full dark page (#141414), vertically + horizontally centered card

**Card** (`#1E1E1E`, 480px wide, 24px radius, 2px border `#2A2A2A`)
- Top: Empath logo mark (small)
- H2: "Let's get you set up" (32px, 700)
- Subtitle: "We'll use your webcam to track focus. Nothing is stored remotely." (14px, gray)
- Divider line
- Input 1: "Your name" (full width, dark input, white text, `#2A2A2A` border)
- Input 2: "What are you studying today?" (same style)
- Input 3: "YouTube video URL" (same style, placeholder: "https://youtube.com/watch?v=...")
- CTA button: `Begin Session →` (full width, white-fill on hover)
- Fine print: "Webcam access requested on next screen"

**Background decoration**:
- 4–5 floating emotion pills drift around the card: `😊 focused`, `😐 neutral`, `😟 distressed` etc.
- Framer Motion `animate={{ y: [0, -12, 0] }}` loop

---

### Page 3 — Session (`/session`)

**Layout**: Cinematic — video fills center, floating panels overlay

**Top bar** (fixed, full-width, semi-transparent blur `backdrop-blur-md`, bg `rgba(20,20,20,0.8)`)
- Left: Empath logo (small) + session topic text
- Center: live elapsed time counter
- Right: `End Session` pill button (red outline → red fill on hover)

**Video area** (16:9, max-w-5xl, centered, rounded-xl)
- YouTube IFrame embedded, no YouTube controls bar styled away
- Dark letterbox surround

**Floating overlays** (absolutely positioned over/around video):

- **Focus Score** (top-right of video, floating card):
  - Large number (48px, white, 800 weight)
  - Colored ring around it (SVG circle, color = current emotion color)
  - Label: "Focus Score" (12px, gray)
  - Animates: scale spring on score change

- **Emotion pill** (bottom-left of video):
  - `● [emoji] [emotion]` — colored bg matching emotion
  - Slides in with spring animation on state change

- **Phone detected warning** (bottom-center of video):
  - Red pill: `📱 Phone detected — focus -40`
  - Slides up from bottom, auto-dismisses after 4s

- **Webcam feed** (bottom-right, circular, 100px diameter):
  - Live webcam stream in circle
  - Pulsing green ring when analyzing (CSS animation)
  - Grayed out / lock icon if permission denied

- **Suggestion alert** (slides in from right edge):
  - Dark card (`#1E1E1E`), 300px wide
  - AI suggestion text (14px)
  - Action button: e.g. `Slow down video` / `Take a 2min break`
  - Dismiss X button
  - Auto-dismisses after 8s

**Focus Timeline** (below video, full-width dark card)
- Recharts LineChart
- X-axis: time (seconds) | Y-axis: 0–100
- Line color transitions with emotion color (single color = current emotion's color)
- Dot on latest point
- Last 60 data points shown (2-min rolling window)

**Suggestion History** (below chart, horizontal scroll)
- Small pill list: `[00:45] Try rewinding` `[02:10] Take a break` etc.
- Each colored by emotion state at time of suggestion

---

### Page 4 — Report (`/report/:sessionId`)

**Page header**
- Back button: `← New Session`
- Title: "Session Report" + date/time + topic

**Hero stat** (centered, top of page)
- Giant focus score (96px, colored ring, Framer Motion count-up animation)
- Subtitle: "Average Focus Score" + session duration

**Emotion Breakdown** (5-column row of cards)
- Each card: emotion color top border, emotion name, percentage of session, time in seconds
- e.g.: `focused — 45% — 4m 30s`

**Focus Timeline** (large, full-width)
- Recharts AreaChart with gradient fill
- X-axis: timestamps | Y-axis: 0–100
- Gradient color shifts based on score (green high, red low)
- Reference lines at 80 (focused) and 40 (confused) thresholds

**Behavior Events** (horizontal timeline bar)
- Color-coded dots on a timeline: pause=yellow, rewind=orange, phone=red, idle=pink
- Tooltip on hover shows event type + timestamp

**AI Suggestions Given** (card list)
- Each card: timestamp pill | suggestion text | action taken
- Empty state: "No suggestions needed — great session!"

**Action buttons** (bottom)
- `Start New Session` (primary pill)
- `Copy Report Link` (outline pill)

---

## Routing (React Router)

```
/           → LandingPage
/start      → QuickStartPage
/session    → SessionPage
/report/:id → ReportPage
```

## Animations Summary (Framer Motion)

| Element              | Animation                                  |
|----------------------|--------------------------------------------|
| Floating shapes      | y: [0, -15, 0], 4s loop, ease in-out      |
| Floating pills       | x/y drift, random offset, 3–5s loop       |
| Focus score change   | scale spring (1 → 1.15 → 1)              |
| Emotion pill         | x: slide in from left, spring             |
| Suggestion alert     | x: slide in from right (+300px → 0)       |
| Phone warning        | y: slide up (40px → 0), auto exit         |
| Section reveal       | y: 30px → 0, opacity 0 → 1 on scroll     |
| Stats counter        | count-up number animation on mount        |

---

## Tech Stack

- **Framework**: React 18 + Vite
- **Styling**: TailwindCSS (dark theme config)
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Routing**: React Router v6
- **Video**: YouTube IFrame API (react-youtube)
- **API**: Axios (calls FastAPI backend at localhost:8000)
- **Webcam**: getUserMedia API, manual canvas capture

## Key Implementation Notes

- Webcam capture: `setInterval(captureAndAnalyze, 2000)` — 2s interval
- If webcam denied: behavior-only mode (no emotion detection, score = behavior only)
- `phone_detected: true` in analyze-emotion response → auto-call behavior-event with `phone_detected`
- Session state stored in React context (sessionId, studentName, topic)
- YouTube URL parsing: extract video ID for IFrame embed
- All API calls to `http://localhost:8000/api/...`
