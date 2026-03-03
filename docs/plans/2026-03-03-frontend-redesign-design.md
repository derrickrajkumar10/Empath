# Empath Frontend Redesign Design Document

**Date:** 2026-03-03
**Reference:** Notion website (notion.so) — clean light-mode SaaS aesthetic
**Approach:** Option A — Pure Notion Replica translated to Empath content

---

## Design Language

### Color System (Full Light Mode)

```
Background:       #FFFFFF
Surface cards:    #F7F7F5  (Notion off-white)
Borders:          #E8E8E8
Text primary:     #191919  (near-black)
Text secondary:   #6B7280
Text muted:       #9CA3AF
CTA button:       #000000 filled, white text
CTA hover:        #333333

Emotion accents (unchanged):
  focused:    #4ADE80  (green)
  neutral:    #FACC15  (yellow)
  confused:   #FB923C  (orange)
  bored:      #F472B6  (pink)
  distressed: #F87171  (red)

Session page exception:
  Session bg: #0F0F0F  (dark — video viewing context)
  Frosted glass overlays: rgba(15,15,15,0.7) + backdrop-blur(16px)
```

### Typography
- **Font:** Inter (unchanged)
- **Hero headline:** 72px, 800 weight, `#191919`
- **Section headings:** 40px, 700 weight
- **Card titles:** 20px, 600 weight
- **Body:** 16px, 400 weight, `#6B7280`
- **Meta/labels:** 13px, 500 weight, uppercase tracking-wider

### Tailwind Config Additions

New tokens to add to `tailwind.config.js`:
```js
colors: {
  page:    '#FFFFFF',
  surface: '#F7F7F5',
  'border-light': '#E8E8E8',
  primary: '#191919',
  muted:   '#6B7280',
  // keep existing: bg (#141414), surface-dark (#1E1E1E), border (#2A2A2A)
}
```

New utilities in `index.css`:
```css
.card-light    { @apply bg-surface rounded-xl border border-border-light p-6; }
.pill-btn-dark { @apply px-6 py-3 rounded-full border border-white/20 text-white hover:bg-white hover:text-black transition-all; }
.btn-black     { @apply px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-gray-800 transition-colors; }
```

---

## Pages

### Page 1 — Landing (`/`)

#### Navbar (sticky)
- White bg, `border-bottom: 1px solid #E8E8E8` on scroll (via `useScroll`)
- Left: `[E]` square logo (black bg, white "E") + "Empath" wordmark
- Center: Features · How It Works · Templates (text links, `#6B7280` → `#191919` hover)
- Right: ghost "Log in" + black pill `Start Learning →`

#### Hero (100vh, white bg)
- **Left 55%:**
  - `WordBuildHero` component — staggered word-by-word Framer Motion reveal
    - Sequence: "Study." (gray) → builds to **"Study, track, focus, grow."** (near-black, 72px, 800w)
    - Each word: `opacity: 0→1`, `y: 20→0`, stagger 0.08s per word
  - Subtitle: "Empath reads your emotions in real time and adapts your learning experience — so you stay focused and never fall behind." (18px, gray)
  - CTA row: `Start Learning free →` (black filled btn) + `See how it works →` (ghost link)
  - Below CTAs: floating emotion pill cluster — `● focused`, `● neutral`, `● confused` drifting with Framer float loop
- **Right 45%:**
  - Browser chrome frame (rounded-xl, 3 traffic-light dots, url bar "empath.app/session")
  - Inside frame: screenshot/mockup of the Empath session UI (video player + focus score overlay + emotion pill)
  - Frame slides up `y: 60→0` on mount, then subtle float `y: [0,-8,0]` loop
  - Right-edge decorations: floating geometric shapes in emotion colors (star, circle, squiggle)

#### Feature Tabs Section (`FeatureTabSection` component)
- Light gray bg (`#F7F7F5`), full-width section
- Tab bar: `Emotion Detection` · `Focus Score` · `Smart Interventions` · `Reports`
  - Active tab: black text + sliding underline indicator (Framer Motion `layoutId`)
  - Inactive: `#6B7280`
- Content (changes per tab, `AnimatePresence` cross-fade):
  - Left: heading + 2–3 bullet points describing the feature
  - Right: relevant product mockup screenshot in a card frame
- Tab content:
  1. **Emotion Detection** — "Reads 5 emotional states from your face every 2 seconds..." + emotion analysis mockup
  2. **Focus Score** — "A real-time 0–100 score combining facial emotion + behavior..." + score ring mockup
  3. **Smart Interventions** — "When focus drops, Empath suggests pauses, rewinds, or breaks..." + suggestion card mockup
  4. **Reports** — "After every session, a full breakdown of your attention..." + report chart mockup

#### Trust Strip
- "Used by learners from" (gray label, centered)
- Text logos in a horizontal row: `MIT OCW` · `Khan Academy` · `Coursera` · `edX` · `YouTube Learning`
- Subtle gray text, `font-weight: 600`, separated by `·` dividers

#### Stats Band (light gray bg)
- 4 counters: `5` Emotions · `2s` Update Interval · `3` AI Models · `100%` Private
- Count-up animation on scroll-enter
- Large bold number (48px, `#191919`) + small gray label below

#### Study Templates (`StudyTemplates` component)
- Heading: "The right session for every study style"
- Sub: "Pick a template to pre-fill your session setup"
- 3-col grid (6 cards):
  | Template | Icon | Description |
  |---|---|---|
  | Exam Prep | 🎯 | Intense 25-min Pomodoro focus blocks |
  | Lecture Watch | 🎬 | Auto-pauses when confusion is detected |
  | Tutorial Sprint | ⚡ | Fast-paced active learning |
  | Deep Work | 🔭 | 90-minute flow state sessions |
  | Speed Run | 🏃 | Marathon 3-hour session mode |
  | Language Learning | 📖 | Reading + video comprehension combo |
- Card: white bg, `#E8E8E8` border, hover lifts shadow slightly, "Use template →" blue/underline link
- Click navigates to `/start?template=exam_prep` (pre-fills topic via query param)

#### Testimonials (`Testimonials` component)
- Heading: "Students study smarter with Empath"
- 2-col masonry-style grid, 4 cards:
  - Card: white bg, light border, circular avatar (colored initials bg), student name + title + quote + `🟢 Focus: 87` badge
  - Example entries (static):
    - "Aanya R." — "CS Student, Year 3" — "I used to zone out during long lectures. Empath caught me drifting before I even noticed."
    - "Marcus T." — "Pre-Med, Year 2" — "The pause suggestions are scary accurate. It's like having a study coach watching."
    - "Lena W." — "Language Learner" — "Studied Japanese for 2 hours with a 91 avg focus score. My personal best."
    - "Kian D." — "Bootcamp Student" — "Empath helped me stay in flow for 90 minutes straight. Didn't think that was possible."

#### Bottom CTA
- Heading: "Start studying smarter." (40px, 700w)
- Sub: "No account needed. Just a YouTube link."
- `Begin Session →` (black filled, large)

#### Footer
- Left: `[E]` logo + "Empath — AI-Powered Learning"
- Right: GitHub · Report Issue · Built for BIS Standards Hackathon 2026

---

### Page 2 — Quick Start (`/start`)

- Full page bg: `#F7F7F5`
- Centered white card: `border: 1px solid #E8E8E8`, `border-radius: 16px`, `box-shadow: 0 4px 24px rgba(0,0,0,0.06)`, max-w-md
- Top: `[E]` logo + "Empath" text
- H2: "Let's get you set up" (28px, 800w, `#191919`)
- Subtitle: "Nothing is stored remotely. Just your name, topic, and a YouTube link." (13px, gray)
- Divider
- Inputs: white bg, `#E8E8E8` border, `#191919` text, focus ring = `2px solid #191919`
- Button: full-width black (`#000000`), white text, `Begin Session →`, height 52px, rounded-lg
- Fine print: "Webcam access will be requested on the next screen" (gray, 12px, centered)
- Template pre-fill: if `?template=` query param present, auto-populate topic field with template name
- Background decoration: 5–6 small floating emotion pills at 30% opacity drifting slowly

---

### Page 3 — Session (`/session`)

**Exception page: stays dark (`#0F0F0F`)**

All overlays become frosted glass:
```css
background: rgba(15,15,15,0.7);
backdrop-filter: blur(16px);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 16px;
```

- **Top bar:** frosted glass, full-width fixed — logo left, elapsed timer center, red-outline "End Session" right
- **Video area:** unchanged — 16:9, max-w-5xl, rounded-xl, centered
- **Focus Score overlay (top-right):** frosted glass card wrapping the SVG ring
- **Emotion pill (bottom-left):** unchanged
- **Webcam bubble (bottom-right):** unchanged, pulsing green CSS ring
- **Phone warning (bottom-center):** unchanged red pill
- **Suggestion alert (right edge):** frosted glass card + colored left-border accent (`border-left: 3px solid [emotion-color]`)
- **Focus chart:** unchanged dark card below video
- **Suggestion history pills:** unchanged

---

### Page 4 — Report (`/report/:id`)

**Full white page**

- **Header:** white bg, `← New Session` left, "Session Report" + date center, border-bottom
- **Hero score section:** white bg, centered
  - `ScoreRing` component: score ring on white (track stroke `#E8E8E8`, colored arc)
  - Score number: `#191919`, 80px
  - Below ring: "Average Focus Score" (gray label) + session duration "14 min 32s" + engagement label `● Mostly Focused` in emotion color
- **Emotion breakdown:** 5 white cards, `border-top: 4px solid [emotion-color]`, `#F7F7F5` bg, emotion name + pct% + time
- **Focus Timeline:** white card, `AreaChart` with light gray gridlines, colored gradient area
- **Behavior Events Timeline** (`BehaviorTimeline` component — NEW):
  - Full-width white card, heading "Behavior Events"
  - Horizontal bar with dots positioned at `left: (timestamp / duration * 100)%`
  - Colors: pause=`#FACC15`, rewind=`#FB923C`, phone=`#F87171`, idle=`#F472B6`
  - Tooltip on hover: event type + formatted timestamp
  - Uses `report.behavior_events` from existing API
- **AI Suggestions list:** white cards with colored left-border, timestamp pill, suggestion text, action badge
- **Empty state:** "No suggestions needed — great session! 🎉" card
- **Actions:** `Start New Session →` (black filled) + `Copy Report Link` (gray outline)

---

## Animations Summary

| Element | Animation |
|---|---|
| Hero words | `opacity:0→1, y:20→0`, stagger 0.08s per word |
| Hero mockup | `y:60→0` mount + `y:[0,-8,0]` 4s float loop |
| Floating pills (hero) | `y:[0,-12,0], x:[0,±6,0]` 3–5s independent loops |
| Feature tab switch | `AnimatePresence` cross-fade, `layoutId` underline |
| Template cards | Fade-up stagger on scroll-enter (`viewport: once`) |
| Testimonials | Same fade-up stagger |
| Stat counters | Count-up on scroll-enter |
| Navbar | Transparent→white with border on scroll |
| Session score | `scale:1→1.1→1` spring on value change |
| Session suggestion | `x:320→0` spring from right |
| Report score ring | CSS `stroke-dashoffset` transition 1s ease on mount |

---

## New Components

| Component | File | Purpose |
|---|---|---|
| `WordBuildHero` | `src/components/WordBuildHero.jsx` | Staggered word-by-word reveal animation |
| `FeatureTabSection` | `src/components/FeatureTabSection.jsx` | 4-tab product feature showcase |
| `StudyTemplates` | `src/components/StudyTemplates.jsx` | 6 template cards, pre-fills QuickStart |
| `Testimonials` | `src/components/Testimonials.jsx` | 4 static student testimonial cards |
| `BehaviorTimeline` | `src/components/BehaviorTimeline.jsx` | Dot timeline for report behavior events |

---

## What Changes vs What Stays

**Unchanged:**
- All API calls (`src/api.js`)
- Session context (`src/context/SessionContext.jsx`)
- Webcam hook (`src/hooks/useWebcam.js`)
- Video player logic (`src/components/VideoPlayer.jsx`)
- EmotionPill component
- All backend code

**Rewritten:**
- `LandingPage.jsx` — full Notion-style redesign
- `QuickStartPage.jsx` — light mode card + black CTA
- `SessionPage.jsx` — frosted glass overlays (logic unchanged)
- `ReportPage.jsx` — white page + behavior timeline added

**Modified:**
- `tailwind.config.js` — add light-mode color tokens
- `index.css` — add `.card-light`, `.btn-black`, `.pill-btn-dark` utilities
- `FloatingDecorations.jsx` — accept `dark` prop for session page

---

## Routing

```
/           → LandingPage  (light)
/start      → QuickStartPage (light, supports ?template= query param)
/session    → SessionPage (dark, frosted glass)
/report/:id → ReportPage (light)
```

## Tech Stack (unchanged)
React 18 + Vite 5 · TailwindCSS 3 · Framer Motion 11 · Recharts 2 · React Router v6 · Axios · react-youtube
