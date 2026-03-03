# Empath Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Empath frontend from dark 10X-Designers aesthetic to a clean Notion-inspired light-mode design with word-build hero animation, feature tabs, study templates, testimonials, and frosted-glass session page.

**Architecture:** Full light mode (#FFFFFF bg) for Landing/Start/Report pages. Session page stays dark (#0F0F0F) with frosted-glass overlays. All logic/API/routing unchanged — purely visual redesign + 5 new UI-only components. No backend changes.

**Tech Stack:** React 18, Vite 5, TailwindCSS 3, Framer Motion 11, Recharts 2, React Router v6

**Design Reference:** `docs/plans/2026-03-03-frontend-redesign-design.md`

---

### Task 1: Update Tailwind config and CSS utilities

**Files:**
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/src/index.css`

**Step 1: Replace tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Light mode (Landing, Start, Report)
        page:    '#FFFFFF',
        surface: '#F7F7F5',
        'border-light': '#E8E8E8',
        primary: '#191919',
        secondary: '#6B7280',
        // Dark mode (Session page)
        bg:      '#0F0F0F',
        'surface-dark': '#1A1A1A',
        border:  '#2A2A2A',
        muted:   '#555555',
        // Emotion colors
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

**Step 2: Replace index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    background-color: #FFFFFF;
    color: #191919;
    font-family: 'Inter', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  /* Light inputs (used in QuickStart) */
  input, textarea {
    background-color: #FFFFFF;
    color: #191919;
    border: 1px solid #E8E8E8;
    border-radius: 8px;
    padding: 12px 16px;
    width: 100%;
    outline: none;
    transition: border-color 0.2s;
  }
  input:focus, textarea:focus {
    border-color: #191919;
    box-shadow: 0 0 0 2px rgba(25,25,25,0.08);
  }
  input::placeholder { color: #9CA3AF; }
}

@layer utilities {
  /* Light mode card */
  .card-light {
    @apply bg-white border border-border-light rounded-2xl p-6;
  }
  /* Dark card (session page) */
  .card-dark {
    @apply bg-surface-dark border border-border rounded-2xl p-6;
  }
  /* Black CTA button (light pages) */
  .btn-black {
    @apply px-6 py-3 rounded-lg bg-primary text-white text-sm font-semibold
           transition-all duration-200 hover:bg-gray-800 cursor-pointer;
  }
  /* Ghost button (light pages) */
  .btn-ghost {
    @apply px-6 py-3 rounded-lg border border-border-light text-primary text-sm font-semibold
           transition-all duration-200 hover:bg-surface cursor-pointer;
  }
  /* Dark pill button (session page) */
  .pill-btn-dark {
    @apply px-6 py-3 rounded-full border border-white/20 text-white text-sm font-medium
           transition-all duration-200 hover:bg-white hover:text-black cursor-pointer;
  }
  /* Keep old aliases for session/report pages */
  .pill-btn { @apply pill-btn-dark; }
  .pill-btn-solid {
    @apply px-6 py-3 rounded-full bg-white text-black text-sm font-medium
           transition-all duration-200 hover:bg-white/90 cursor-pointer;
  }
  .card { @apply card-dark; }
}
```

**Step 3: Verify dev server still starts**

```bash
cd frontend && npm run dev
```
Expected: server starts on http://localhost:5173 with no CSS errors.

**Step 4: Commit**

```bash
cd frontend
git add tailwind.config.js src/index.css
git commit -m "feat: add light-mode color tokens and CSS utilities"
```

---

### Task 2: WordBuildHero component

**Files:**
- Create: `frontend/src/components/WordBuildHero.jsx`

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'

// Words: first word fades in as gray, rest stagger in as black
const WORDS = ['Study.', 'Track.', 'Focus.', 'Grow.']

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const wordVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export default function WordBuildHero() {
  return (
    <motion.h1
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-6xl md:text-7xl font-extrabold leading-tight tracking-tight text-primary"
    >
      {WORDS.map((word, i) => (
        <motion.span
          key={word}
          variants={wordVariants}
          className="inline-block mr-4"
          style={{ color: i === 0 ? '#9CA3AF' : '#191919' }}
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  )
}
```

**Step 2: Visual check**
Import and render `<WordBuildHero />` temporarily in App.jsx to verify the staggered word animation works. Remove after confirming.

**Step 3: Commit**

```bash
git add src/components/WordBuildHero.jsx
git commit -m "feat: add WordBuildHero staggered word animation"
```

---

### Task 3: SessionMockup component (hero product screenshot)

**Files:**
- Create: `frontend/src/components/SessionMockup.jsx`

This renders a CSS browser-frame mockup of the session page — no actual screenshots needed.

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'

export default function SessionMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-lg"
      style={{
        animation: 'float 5s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* Browser chrome */}
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
           style={{ background: '#0F0F0F' }}>
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 mx-4 bg-gray-800 rounded-md px-3 py-1 text-gray-400 text-xs text-center">
            empath.app/session
          </div>
        </div>

        {/* Session UI mockup */}
        <div className="relative p-4" style={{ background: '#0F0F0F' }}>
          {/* Top bar mockup */}
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                <span className="text-black font-bold text-xs">E</span>
              </div>
              <span className="text-white text-xs font-medium">Introduction to ML</span>
            </div>
            <span className="text-white font-mono text-sm">12:34</span>
          </div>

          {/* Video area */}
          <div className="relative rounded-xl overflow-hidden mb-3"
               style={{ aspectRatio: '16/9', background: '#1a1a2e' }}>
            {/* Fake video content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white/80 border-b-[8px] border-b-transparent ml-1" />
              </div>
            </div>

            {/* Focus score overlay */}
            <div className="absolute top-3 right-3 flex flex-col items-center"
                 style={{ background: 'rgba(15,15,15,0.7)', backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '6px 10px' }}>
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#2A2A2A" strokeWidth="4" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="#4ADE80" strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 18}`}
                        strokeDashoffset={`${2 * Math.PI * 18 * 0.18}`}
                        transform="rotate(-90 22 22)" />
              </svg>
              <span className="text-white font-bold text-xs absolute top-1/2 -translate-y-1/2">82</span>
              <span className="text-gray-400 text-xs mt-0.5">Focus</span>
            </div>

            {/* Emotion pill overlay */}
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-black"
                 style={{ background: '#4ADE80' }}>
              😊 focused
            </div>

            {/* Webcam bubble */}
            <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full overflow-hidden border-2 border-green-400"
                 style={{ background: '#1a1a2e' }}>
              <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
            </div>
          </div>

          {/* Mini chart */}
          <div className="rounded-lg p-2" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <div className="flex items-end gap-0.5 h-8">
              {[65, 70, 72, 68, 75, 78, 80, 82, 79, 82, 85, 82].map((v, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{
                  height: `${(v / 100) * 100}%`,
                  background: i === 11 ? '#4ADE80' : 'rgba(74,222,128,0.3)',
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/SessionMockup.jsx
git commit -m "feat: add SessionMockup hero product illustration"
```

---

### Task 4: FeatureTabSection component

**Files:**
- Create: `frontend/src/components/FeatureTabSection.jsx`

**Step 1: Create the component**

```jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const TABS = [
  {
    id: 'emotion',
    label: 'Emotion Detection',
    heading: 'Reads your emotions every 2 seconds.',
    bullets: [
      'Detects 5 states: focused, neutral, confused, bored, distressed',
      'Uses a fine-tuned vision model — runs 100% locally on your device',
      'Updates in real time with no perceptible lag',
    ],
    visual: (
      <div className="flex flex-col gap-3">
        {[
          { label: 'focused',    color: '#4ADE80', pct: 45 },
          { label: 'neutral',    color: '#FACC15', pct: 30 },
          { label: 'confused',   color: '#FB923C', pct: 15 },
          { label: 'bored',      color: '#F472B6', pct: 6  },
          { label: 'distressed', color: '#F87171', pct: 4  },
        ].map(e => (
          <div key={e.label} className="flex items-center gap-3">
            <span className="w-24 text-sm text-secondary capitalize">{e.label}</span>
            <div className="flex-1 h-2 rounded-full bg-border-light overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${e.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: e.color }}
              />
            </div>
            <span className="w-8 text-sm text-secondary text-right">{e.pct}%</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'score',
    label: 'Focus Score',
    heading: 'A real-time 0–100 attention score.',
    bullets: [
      'Combines facial emotion (60%) + video behavior signals (40%)',
      'Penalizes distractions: pausing, rewinding, phone detection',
      'Live ring visualization updates with each webcam capture',
    ],
    visual: (
      <div className="flex items-center justify-center py-4">
        <div className="relative" style={{ width: 160, height: 160 }}>
          <svg width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="68" fill="none" stroke="#E8E8E8" strokeWidth="10" />
            <circle cx="80" cy="80" r="68" fill="none" stroke="#4ADE80" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 68}`}
                    strokeDashoffset={`${2 * Math.PI * 68 * 0.17}`}
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dashoffset 1s ease' }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-extrabold text-primary">83</span>
            <span className="text-sm text-secondary">/ 100</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'interventions',
    label: 'Smart Interventions',
    heading: 'AI nudges you before you lose the thread.',
    bullets: [
      'Triggers when focus score drops below 50',
      'Powered by Flan-T5 — generates personalized suggestions',
      'Actions: rewind video, take a break, slow down playback',
    ],
    visual: (
      <div className="rounded-xl border border-border-light bg-white p-5 shadow-sm">
        <div className="text-xs text-secondary uppercase tracking-widest mb-3">Empath Suggests</div>
        <p className="text-primary text-sm leading-relaxed mb-4">
          "You've looked confused for the last 30 seconds. Try rewinding 60 seconds and watching at 0.75× speed."
        </p>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-white cursor-pointer">
            Rewind 60s
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface text-secondary cursor-pointer">
            Dismiss
          </span>
        </div>
      </div>
    ),
  },
  {
    id: 'reports',
    label: 'Reports',
    heading: 'Every session analyzed, end to end.',
    bullets: [
      'Average focus score, emotion breakdown, total session time',
      'Full focus timeline chart with gradient area fill',
      'Complete log of behavior events and AI suggestions given',
    ],
    visual: (
      <div className="space-y-3">
        <div className="flex gap-3">
          {[
            { label: 'Avg Focus', value: '83', color: '#4ADE80' },
            { label: 'Duration', value: '18m', color: '#FACC15' },
            { label: 'Suggestions', value: '2', color: '#FB923C' },
          ].map(s => (
            <div key={s.label} className="flex-1 rounded-xl border border-border-light p-4 text-center"
                 style={{ borderTopColor: s.color, borderTopWidth: 3 }}>
              <div className="text-2xl font-extrabold text-primary">{s.value}</div>
              <div className="text-xs text-secondary mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border-light p-4 h-20 flex items-end gap-1">
          {[50,55,60,65,70,72,75,80,82,85,83,84,87,85,88,83].map((v, i) => (
            <div key={i} className="flex-1 rounded-sm"
                 style={{ height: `${v}%`, background: i > 10 ? '#4ADE80' : '#E8E8E8' }} />
          ))}
        </div>
      </div>
    ),
  },
]

export default function FeatureTabSection() {
  const [active, setActive] = useState('emotion')
  const tab = TABS.find(t => t.id === active)

  return (
    <section className="py-24 bg-surface">
      <div className="max-w-5xl mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-primary mb-3">Everything in one place</h2>
          <p className="text-secondary text-lg">Three AI models working together, invisibly.</p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-10 border-b border-border-light">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="relative px-5 py-3 text-sm font-medium transition-colors cursor-pointer"
              style={{ color: active === t.id ? '#191919' : '#6B7280' }}
            >
              {t.label}
              {active === t.id && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h3 className="text-2xl font-extrabold text-primary mb-6">{tab.heading}</h3>
              <ul className="space-y-4">
                {tab.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-secondary">
                    <span className="mt-0.5 text-primary font-bold">→</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>{tab.visual}</div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/FeatureTabSection.jsx
git commit -m "feat: add FeatureTabSection with animated tab switcher"
```

---

### Task 5: StudyTemplates component

**Files:**
- Create: `frontend/src/components/StudyTemplates.jsx`

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const TEMPLATES = [
  { icon: '🎯', name: 'Exam Prep', desc: 'Intense 25-min Pomodoro focus blocks', topic: 'Exam Preparation' },
  { icon: '🎬', name: 'Lecture Watch', desc: 'Auto-pauses when confusion is detected', topic: 'Lecture' },
  { icon: '⚡', name: 'Tutorial Sprint', desc: 'Fast-paced active coding or how-to learning', topic: 'Tutorial' },
  { icon: '🔭', name: 'Deep Work', desc: '90-minute uninterrupted flow state', topic: 'Deep Work Session' },
  { icon: '🏃', name: 'Speed Run', desc: 'Marathon 3-hour study session', topic: 'Speed Run' },
  { icon: '📖', name: 'Language Learning', desc: 'Reading + video comprehension combo', topic: 'Language Learning' },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
}

export default function StudyTemplates() {
  const navigate = useNavigate()

  return (
    <section id="templates" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-8">
        <motion.div {...fadeUp} className="text-center mb-4">
          <h2 className="text-4xl font-extrabold text-primary">The right session for every study style</h2>
        </motion.div>
        <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="text-secondary text-center mb-12 text-lg">
          Pick a template and we'll pre-fill your session setup.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TEMPLATES.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              onClick={() => navigate(`/start?template=${encodeURIComponent(t.topic)}`)}
              className="bg-white border border-border-light rounded-2xl p-6 cursor-pointer
                         hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="text-3xl mb-3">{t.icon}</div>
              <h3 className="text-base font-bold text-primary mb-1">{t.name}</h3>
              <p className="text-secondary text-sm mb-4 leading-relaxed">{t.desc}</p>
              <span className="text-sm font-medium text-primary underline underline-offset-2
                               group-hover:no-underline transition-all">
                Use template →
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/StudyTemplates.jsx
git commit -m "feat: add StudyTemplates section with 6 pre-fill cards"
```

---

### Task 6: Testimonials component

**Files:**
- Create: `frontend/src/components/Testimonials.jsx`

**Step 1: Create the component**

```jsx
import { motion } from 'framer-motion'

const TESTIMONIALS = [
  {
    name: 'Aanya R.',
    role: 'CS Student, Year 3',
    quote: "I used to zone out during long lectures. Empath caught me drifting before I even noticed — the rewind nudge is genuinely useful.",
    score: 87,
    color: '#4ADE80',
    initials: 'AR',
    bgColor: '#DCFCE7',
  },
  {
    name: 'Marcus T.',
    role: 'Pre-Med, Year 2',
    quote: "The pause suggestions are scary accurate. It's like having a study coach watching over your shoulder without being annoying.",
    score: 79,
    color: '#FACC15',
    initials: 'MT',
    bgColor: '#FEF9C3',
  },
  {
    name: 'Lena W.',
    role: 'Language Learner',
    quote: "Studied Japanese with Empath for 2 hours and hit a 91 avg focus score. My personal best by far. The emotion feedback loop is addictive.",
    score: 91,
    color: '#4ADE80',
    initials: 'LW',
    bgColor: '#DCFCE7',
  },
  {
    name: 'Kian D.',
    role: 'Bootcamp Student',
    quote: "I stayed in flow for 90 minutes straight. Didn't think that was possible for me. The 'distressed' alert snapped me back twice.",
    score: 84,
    color: '#4ADE80',
    initials: 'KD',
    bgColor: '#DCFCE7',
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-5xl mx-auto px-8">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-extrabold text-primary text-center mb-4"
        >
          Students study smarter with Empath
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-secondary text-center text-lg mb-12"
        >
          Real focus scores. Real results.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white border border-border-light rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-primary"
                       style={{ background: t.bgColor }}>
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-primary text-sm">{t.name}</div>
                    <div className="text-secondary text-xs">{t.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                     style={{ background: t.bgColor, color: '#191919' }}>
                  <span style={{ color: t.color }}>●</span>
                  Focus: {t.score}
                </div>
              </div>
              <p className="text-secondary text-sm leading-relaxed">"{t.quote}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/Testimonials.jsx
git commit -m "feat: add Testimonials section with focus score badges"
```

---

### Task 7: BehaviorTimeline component

**Files:**
- Create: `frontend/src/components/BehaviorTimeline.jsx`

**Step 1: Create the component**

```jsx
import { useState } from 'react'

const EVENT_COLORS = {
  pause:          '#FACC15',
  rewind:         '#FB923C',
  fast_forward:   '#818CF8',
  phone_detected: '#F87171',
  idle_start:     '#F472B6',
}

const EVENT_LABELS = {
  pause:          'Paused',
  rewind:         'Rewound',
  fast_forward:   'Fast forwarded',
  phone_detected: 'Phone detected',
  idle_start:     'Went idle',
}

export default function BehaviorTimeline({ events, durationSeconds }) {
  const [tooltip, setTooltip] = useState(null)

  if (!events || events.length === 0) {
    return (
      <div className="card-light">
        <h2 className="text-xs text-secondary uppercase tracking-widest mb-3">Behavior Events</h2>
        <p className="text-secondary text-sm">No behavior events recorded.</p>
      </div>
    )
  }

  const duration = durationSeconds || 1

  function formatTs(s) {
    const m = Math.floor(s / 60)
    const sec = Math.round(s) % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="card-light">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs text-secondary uppercase tracking-widest">Behavior Events</h2>
        <div className="flex items-center gap-3 text-xs text-secondary">
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
              {EVENT_LABELS[type]?.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline bar */}
      <div className="relative h-8 bg-surface rounded-full overflow-visible">
        {/* Track */}
        <div className="absolute inset-y-0 left-0 right-0 bg-border-light rounded-full"
             style={{ top: '50%', transform: 'translateY(-50%)', height: 4 }} />

        {/* Dots */}
        {events.map((ev, i) => {
          const pct = Math.min(100, (ev.timestamp_seconds / duration) * 100)
          const color = EVENT_COLORS[ev.event_type] || '#9CA3AF'
          return (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full cursor-pointer border-2 border-white shadow-sm
                         transition-transform hover:scale-150"
              style={{
                left: `${pct}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: color,
                zIndex: 10,
              }}
              onMouseEnter={() => setTooltip({ ...ev, pct, color })}
              onMouseLeave={() => setTooltip(null)}
            />
          )
        })}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 px-3 py-2 rounded-lg shadow-lg text-xs pointer-events-none"
            style={{
              left: `${Math.min(85, tooltip.pct)}%`,
              top: -40,
              background: '#191919',
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: tooltip.color }}>●</span>{' '}
            {EVENT_LABELS[tooltip.event_type] || tooltip.event_type} at {formatTs(tooltip.timestamp_seconds)}
          </div>
        )}
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-2 text-xs text-secondary">
        <span>0:00</span>
        <span>{formatTs(duration / 2)}</span>
        <span>{formatTs(duration)}</span>
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/BehaviorTimeline.jsx
git commit -m "feat: add BehaviorTimeline dot-on-track component"
```

---

### Task 8: Rewrite LandingPage

**Files:**
- Modify: `frontend/src/pages/LandingPage.jsx`

**Step 1: Replace the entire file**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import WordBuildHero from '../components/WordBuildHero'
import SessionMockup from '../components/SessionMockup'
import FeatureTabSection from '../components/FeatureTabSection'
import StudyTemplates from '../components/StudyTemplates'
import Testimonials from '../components/Testimonials'
import FloatingDecorations from '../components/FloatingDecorations'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

const STATS = [
  { number: 5,    suffix: '',  label: 'Emotions Tracked' },
  { number: 2,    suffix: 's', label: 'Update Interval'  },
  { number: 3,    suffix: '',  label: 'AI Models'        },
  { number: 100,  suffix: '%', label: 'Local & Private'  },
]

function CountUp({ target, suffix }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / 40
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setVal(target); clearInterval(timer) }
      else setVal(Math.floor(start))
    }, 30)
    return () => clearInterval(timer)
  }, [target])
  return <>{val}{suffix}</>
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white text-primary overflow-x-hidden">

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 transition-all duration-200
                       ${scrolled ? 'bg-white border-b border-border-light shadow-sm' : 'bg-transparent'}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-extrabold text-sm">E</span>
          </div>
          <span className="font-bold text-lg text-primary">Empath</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-secondary">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
          <a href="#templates" className="hover:text-primary transition-colors">Templates</a>
        </div>
        <button onClick={() => navigate('/start')} className="btn-black text-sm">
          Start Learning →
        </button>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center px-8 pt-20">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border-light
                         text-xs text-secondary mb-8 uppercase tracking-widest"
            >
              <span className="w-2 h-2 rounded-full bg-green-400" />
              AI-Powered Learning
            </motion.div>

            <WordBuildHero />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-lg text-secondary mt-6 mb-10 leading-relaxed max-w-lg"
            >
              Empath reads your emotions in real time and adapts your learning experience — so you stay focused and never fall behind.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="flex items-center gap-4 flex-wrap mb-10"
            >
              <button onClick={() => navigate('/start')} className="btn-black text-base px-8 py-3.5">
                Start Learning free →
              </button>
              <a href="#features" className="btn-ghost text-base px-8 py-3.5">
                See how it works →
              </a>
            </motion.div>

            {/* Floating emotion pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex flex-wrap gap-2"
            >
              {[
                { label: '😊 focused',  color: '#4ADE80', delay: 0   },
                { label: '😐 neutral',  color: '#FACC15', delay: 0.5 },
                { label: '🤔 confused', color: '#FB923C', delay: 1   },
              ].map(p => (
                <motion.span
                  key={p.label}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3 + p.delay, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold text-black"
                  style={{ background: p.color }}
                >
                  {p.label}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* Right — product mockup */}
          <div className="flex justify-center">
            <SessionMockup />
          </div>
        </div>
      </section>

      {/* Feature tabs */}
      <div id="features">
        <FeatureTabSection />
      </div>

      {/* Trust strip */}
      <section className="py-12 border-t border-b border-border-light bg-white">
        <p className="text-xs text-secondary uppercase tracking-widest text-center mb-6">
          Designed for learners from
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 px-8">
          {['MIT OCW', 'Khan Academy', 'Coursera', 'edX', 'YouTube Learning'].map(name => (
            <span key={name} className="text-base font-semibold text-gray-400 tracking-tight">{name}</span>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-8">
          <motion.h2 {...fadeUp} className="text-4xl font-extrabold text-center text-primary mb-16">
            How it works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '01', title: 'Open a video', desc: 'Paste any YouTube link — lecture, tutorial, documentary — and enter your topic.' },
              { n: '02', title: 'Empath watches', desc: 'Your webcam feed is analyzed locally every 2 seconds. No footage is stored.' },
              { n: '03', title: 'Get nudges', desc: 'When focus dips, Empath intervenes with a targeted suggestion to get you back on track.' },
            ].map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-7xl font-extrabold text-gray-100 mb-3">{s.n}</div>
                <h3 className="text-lg font-bold text-primary mb-2">{s.title}</h3>
                <p className="text-secondary text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-surface border-t border-b border-border-light">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 px-8 text-center">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-5xl font-extrabold text-primary mb-1">
                <CountUp target={s.number} suffix={s.suffix} />
              </div>
              <div className="text-sm text-secondary uppercase tracking-widest">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Study Templates */}
      <StudyTemplates />

      {/* Testimonials */}
      <Testimonials />

      {/* Bottom CTA */}
      <section className="relative py-32 text-center bg-white overflow-hidden">
        <motion.h2 {...fadeUp} className="text-5xl font-extrabold text-primary mb-4">
          Start studying smarter.
        </motion.h2>
        <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="text-secondary text-lg mb-10">
          No account needed. Just a YouTube link.
        </motion.p>
        <motion.button {...fadeUp} transition={{ delay: 0.2 }}
          onClick={() => navigate('/start')}
          className="btn-black text-lg px-12 py-4"
        >
          Begin Session →
        </motion.button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light px-8 py-10 flex items-center justify-between text-sm text-secondary">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xs">E</span>
          </div>
          <span>Empath — AI-Powered Learning</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://github.com" className="hover:text-primary transition-colors">GitHub</a>
          <span>Built for BIS Standards Hackathon 2026</span>
        </div>
      </footer>

    </div>
  )
}
```

**Step 2: Start dev server and verify**

```bash
npm run dev
```
Expected: Landing page loads with white background, word-build hero animation, product mockup on right, all sections render.

**Step 3: Commit**

```bash
git add src/pages/LandingPage.jsx
git commit -m "feat: rewrite LandingPage with Notion-style light mode design"
```

---

### Task 9: Rewrite QuickStartPage with template pre-fill

**Files:**
- Modify: `frontend/src/pages/QuickStartPage.jsx`

**Step 1: Replace the entire file**

```jsx
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { startSession } from '../api'

const FLOATING_PILLS = [
  { label: '😊 focused',    color: '#4ADE80', x: '5%',  y: '15%', delay: 0   },
  { label: '😐 neutral',    color: '#FACC15', x: '88%', y: '25%', delay: 1.2 },
  { label: '🤔 confused',   color: '#FB923C', x: '8%',  y: '72%', delay: 0.8 },
  { label: '😴 bored',      color: '#F472B6', x: '82%', y: '68%', delay: 2.0 },
  { label: '😟 distressed', color: '#F87171', x: '50%', y: '8%',  delay: 1.5 },
]

export default function QuickStartPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { startSession: ctxStart } = useSession()

  const templateTopic = searchParams.get('template') || ''

  const [name, setName] = useState('')
  const [topic, setTopic] = useState(templateTopic)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Update topic if template param changes
  useEffect(() => {
    if (templateTopic) setTopic(templateTopic)
  }, [templateTopic])

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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
         style={{ background: '#F7F7F5' }}>

      {/* Floating pills (subtle) */}
      {FLOATING_PILLS.map((p, i) => (
        <motion.div
          key={i}
          className="absolute px-3 py-1.5 rounded-full text-xs font-semibold text-black pointer-events-none select-none"
          style={{ backgroundColor: p.color, left: p.x, top: p.y, opacity: 0.35 }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {p.label}
        </motion.div>
      ))}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md bg-white rounded-2xl p-8"
        style={{ border: '1px solid #E8E8E8', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-extrabold">E</span>
          </div>
          <span className="font-bold text-xl text-primary">Empath</span>
        </div>

        <h1 className="text-3xl font-extrabold text-primary mb-2">Let's get you set up</h1>
        <p className="text-secondary text-sm mb-8 leading-relaxed">
          Nothing is stored remotely. Just your name, topic, and a YouTube link.
        </p>

        <div className="h-px bg-border-light mb-8" />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-secondary uppercase tracking-widest mb-2">Your name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Derrick"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-secondary uppercase tracking-widest mb-2">What are you studying?</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Introduction to Machine Learning"
            />
            {templateTopic && (
              <p className="text-xs text-secondary mt-1.5">Pre-filled from template</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-secondary uppercase tracking-widest mb-2">YouTube video URL</label>
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-4 py-3 border border-red-100">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-black text-base py-4 mt-2 disabled:opacity-50"
          >
            {loading ? 'Starting...' : 'Begin Session →'}
          </button>
        </form>

        <p className="text-secondary text-xs text-center mt-6">
          Webcam access will be requested on the next screen
        </p>
      </motion.div>

      {/* Back link */}
      <div className="absolute bottom-8 text-center w-full">
        <button onClick={() => navigate('/')} className="text-secondary text-sm hover:text-primary transition-colors">
          ← Back to home
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Verify template pre-fill**

Navigate to `http://localhost:5173/start?template=Exam%20Preparation` — the topic field should be pre-filled.

**Step 3: Commit**

```bash
git add src/pages/QuickStartPage.jsx
git commit -m "feat: rewrite QuickStartPage with light mode and template pre-fill"
```

---

### Task 10: Update SessionPage with frosted glass overlays

**Files:**
- Modify: `frontend/src/pages/SessionPage.jsx`

**Step 1: Apply targeted visual changes only — do NOT touch any logic**

Replace only the JSX return section. Find the `return (` in SessionPage.jsx and replace the entire JSX with the version below. All hooks, state, and functions above the return stay exactly the same.

```jsx
  return (
    <div className="min-h-screen text-white flex flex-col" style={{ background: '#0F0F0F' }}>

      {/* Top bar — frosted glass */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
           style={{ background: 'rgba(15,15,15,0.85)', backdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-extrabold text-xs">E</span>
          </div>
          <span className="text-gray-300 text-sm truncate max-w-xs">{topic}</span>
        </div>
        <div className="text-white font-mono text-lg tabular-nums">{formatTime(elapsedSeconds)}</div>
        <button
          onClick={handleEndSession}
          disabled={isEnding}
          className="px-5 py-2 rounded-full border border-red-500/40 text-red-400 text-sm
                     hover:bg-red-500 hover:text-white hover:border-red-500 transition-all disabled:opacity-50"
        >
          {isEnding ? 'Ending...' : 'End Session'}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-6">

        {/* Video area */}
        <div className="relative w-full max-w-5xl">
          <VideoPlayer
            url={videoUrl}
            onPause={(ts) => handleBehaviorEvent('pause', ts)}
            onPlay={() => {}}
            onSeek={(type, ts) => handleBehaviorEvent(type, ts)}
          />

          {/* Focus Score — frosted glass card top-right */}
          <motion.div
            className="absolute top-4 right-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.4 }}
            key={focusScore}
          >
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl"
                 style={{ background: 'rgba(15,15,15,0.75)', backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(255,255,255,0.08)', width: 100, height: 100 }}>
              <svg className="absolute" width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
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
              <span className="relative text-xs text-gray-400">Focus</span>
            </div>
          </motion.div>

          {/* Emotion pill — bottom left */}
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
            <div className={`relative w-20 h-20 rounded-full overflow-hidden border-2
                             ${hasPermission ? 'border-green-400' : 'border-gray-600'}`}
                 style={{ boxShadow: hasPermission ? '0 0 0 3px rgba(74,222,128,0.25)' : 'none' }}>
              {hasPermission
                ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                : <div className="w-full h-full flex items-center justify-center text-2xl"
                       style={{ background: '#1A1A1A' }}>🔒</div>
              }
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Phone detected warning */}
          <AnimatePresence>
            {phoneDetected && (
              <motion.div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: '#EF4444', zIndex: 20 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                📱 Phone detected — Focus -40
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Suggestion alert — frosted glass with emotion color left border */}
        <AnimatePresence>
          {suggestion && (
            <motion.div
              className="fixed right-6 top-24 w-80 z-50 rounded-2xl p-5"
              style={{
                background: 'rgba(15,15,15,0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `3px solid ${emotionColor}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs text-gray-400 uppercase tracking-widest">Empath Suggests</span>
                <button onClick={() => setSuggestion(null)} className="text-gray-600 hover:text-white text-lg leading-none">×</button>
              </div>
              <p className="text-sm text-white leading-relaxed mb-3">{suggestion.suggestion}</p>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: `${emotionColor}20`, color: emotionColor }}>
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
                <span key={s.id} className="px-3 py-1 rounded-full text-xs border text-gray-400"
                      style={{ background: '#1A1A1A', borderColor: '#2A2A2A' }}>
                  [{Math.floor(s.timestamp / 60)}:{String(s.timestamp % 60).padStart(2,'0')}] {s.suggestion.slice(0, 40)}...
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
```

**Step 2: Verify session page visually**

Start backend, start a session, verify the dark page loads with frosted glass overlays on the score ring and suggestion card.

**Step 3: Commit**

```bash
git add src/pages/SessionPage.jsx
git commit -m "feat: update SessionPage with frosted glass overlay aesthetic"
```

---

### Task 11: Rewrite ReportPage (white mode + behavior timeline)

**Files:**
- Modify: `frontend/src/pages/ReportPage.jsx`

**Step 1: Replace the entire file**

```jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { getSessionReport } from '../api'
import BehaviorTimeline from '../components/BehaviorTimeline'

const EMOTION_COLORS = {
  focused:    '#4ADE80',
  neutral:    '#FACC15',
  confused:   '#FB923C',
  bored:      '#F472B6',
  distressed: '#F87171',
}

const EMOTION_BG = {
  focused:    '#DCFCE7',
  neutral:    '#FEF9C3',
  confused:   '#FFEDD5',
  bored:      '#FCE7F3',
  distressed: '#FEF2F2',
}

function ScoreRing({ score }) {
  const color = score >= 80 ? '#4ADE80' : score >= 60 ? '#FACC15' : score >= 40 ? '#FB923C' : '#F87171'
  const r = 70
  const circ = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: 180, height: 180 }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={r} fill="none" stroke="#E8E8E8" strokeWidth="10" />
        <circle
          cx="90" cy="90" r={r}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score / 100)}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold text-primary">{score}</span>
        <span className="text-xs text-secondary mt-1">/ 100</span>
      </div>
    </div>
  )
}

function formatDuration(seconds) {
  if (!seconds) return '0s'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds) % 60
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-secondary">Loading report...</div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || 'Report not found.'}</p>
        <button onClick={() => navigate('/start')} className="btn-black">Start New Session</button>
      </div>
    )
  }

  const avgScore = Math.round(report.average_focus_score || 0)
  const scoreColor = EMOTION_COLORS[
    avgScore >= 80 ? 'focused' : avgScore >= 60 ? 'neutral' : avgScore >= 40 ? 'confused' : avgScore >= 20 ? 'bored' : 'distressed'
  ]
  const engagementLabel = avgScore >= 80 ? 'Mostly Focused' : avgScore >= 60 ? 'Mostly Neutral' : avgScore >= 40 ? 'Often Confused' : 'Low Engagement'

  const timeline = report.focus_timeline || []
  const emotionCounts = {}
  timeline.forEach(p => { emotionCounts[p.emotion] = (emotionCounts[p.emotion] || 0) + 1 })
  const total = Object.values(emotionCounts).reduce((a, b) => a + b, 0) || 1
  const emotions = ['focused', 'neutral', 'confused', 'bored', 'distressed']

  const durationSeconds = timeline.length > 0
    ? Math.max(...timeline.map(p => p.timestamp_seconds || 0))
    : 0
  const behaviorEvents = report.behavior_events || []

  return (
    <div className="min-h-screen bg-white text-primary pb-16">

      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border-light bg-white sticky top-0 z-10">
        <button onClick={() => navigate('/start')}
                className="text-secondary hover:text-primary text-sm transition-colors">
          ← New Session
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold text-primary">Session Report</h1>
          <p className="text-xs text-secondary">ID: {sessionId?.slice(0, 8)}...</p>
        </div>
        <div style={{ width: 100 }} />
      </div>

      {/* Hero score */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 border-b border-border-light bg-surface"
      >
        <p className="text-xs text-secondary uppercase tracking-widest mb-6">Average Focus Score</p>
        <ScoreRing score={avgScore} />
        <div className="flex items-center gap-2 mt-5">
          <span className="w-2 h-2 rounded-full" style={{ background: scoreColor }} />
          <span className="text-secondary text-sm">{engagementLabel}</span>
        </div>
        <p className="text-secondary text-xs mt-2">
          {formatDuration(durationSeconds)} session · {report.total_events || 0} behavior events
        </p>
      </motion.div>

      <div className="max-w-5xl mx-auto px-8 space-y-8 mt-8">

        {/* Emotion breakdown */}
        <div>
          <h2 className="text-xs text-secondary uppercase tracking-widest mb-4">Emotion Breakdown</h2>
          <div className="grid grid-cols-5 gap-3">
            {emotions.map(em => {
              const count = emotionCounts[em] || 0
              const pct = Math.round((count / total) * 100)
              const secs = count * 2
              return (
                <div key={em} className="rounded-2xl p-5 text-center border border-border-light"
                     style={{ borderTopColor: EMOTION_COLORS[em], borderTopWidth: 4, background: EMOTION_BG[em] || '#F7F7F5' }}>
                  <div className="text-2xl font-extrabold text-primary mb-1">{pct}%</div>
                  <div className="capitalize text-sm font-semibold text-primary">{em}</div>
                  <div className="text-xs text-secondary mt-1">{secs}s</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Timeline chart */}
        {timeline.length > 1 && (
          <div>
            <h2 className="text-xs text-secondary uppercase tracking-widest mb-4">Focus Timeline</h2>
            <div className="card-light">
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={timeline}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={scoreColor} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={scoreColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="timestamp_seconds"
                    tickFormatter={v => `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`}
                    tick={{ fill: '#9CA3AF', fontSize: 11 }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }}
                         axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #E8E8E8', borderRadius: 8, fontSize: 12 }}
                    formatter={(v) => [`${v}`, 'Focus Score']}
                  />
                  <ReferenceLine y={80} stroke="#E8E8E8" strokeDasharray="3 3"
                    label={{ value: 'Focused', fill: '#9CA3AF', fontSize: 10 }} />
                  <ReferenceLine y={40} stroke="#E8E8E8" strokeDasharray="3 3"
                    label={{ value: 'Confused', fill: '#9CA3AF', fontSize: 10 }} />
                  <Area type="monotone" dataKey="focus_score" stroke={scoreColor} strokeWidth={2}
                        fill="url(#scoreGrad)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Behavior events timeline */}
        <div>
          <h2 className="text-xs text-secondary uppercase tracking-widest mb-4">Behavior Events</h2>
          <BehaviorTimeline events={behaviorEvents} durationSeconds={durationSeconds} />
        </div>

        {/* AI Suggestions */}
        <div>
          <h2 className="text-xs text-secondary uppercase tracking-widest mb-4">
            AI Suggestions {report.suggestions?.length ? `(${report.suggestions.length})` : ''}
          </h2>
          {report.suggestions?.length > 0 ? (
            <div className="space-y-3">
              {report.suggestions.map((s, i) => (
                <div key={i} className="card-light flex items-start gap-4"
                     style={{ borderLeft: `3px solid ${scoreColor}` }}>
                  <span className="text-xs text-secondary font-mono mt-0.5 shrink-0 bg-surface px-2 py-1 rounded-md">
                    {Math.floor(s.timestamp_seconds/60)}:{String(Math.round(s.timestamp_seconds)%60).padStart(2,'0')}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-primary">{s.suggestion_text}</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium bg-surface text-secondary">
                      {s.action?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card-light text-center py-10">
              <p className="text-secondary text-sm">No suggestions needed — great session! 🎉</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-4 pb-8">
          <button onClick={() => navigate('/start')} className="btn-black px-8 py-3">
            Start New Session →
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(window.location.href)}
            className="btn-ghost px-8 py-3"
          >
            Copy Report Link
          </button>
        </div>

      </div>
    </div>
  )
}
```

**Step 2: Verify report page**

Complete a session and navigate to the report. Verify: white background, colored emotion cards, behavior timeline with dots, chart with light gridlines.

**Step 3: Commit**

```bash
git add src/pages/ReportPage.jsx
git commit -m "feat: rewrite ReportPage with light mode and behavior timeline"
```

---

### Task 12: Integration test — full flow

**Step 1: Start backend**

```bash
cd backend && conda activate empath && uvicorn main:app --reload --port 8000
```
Wait for: "Models ready."

**Step 2: Start frontend**

```bash
cd frontend && npm run dev
```

**Step 3: Test full flow**

1. Open `http://localhost:5173` — verify light landing page, word-build animation plays
2. Hover feature tabs — verify AnimatePresence cross-fades
3. Scroll to templates — click "Exam Prep" — verify `/start?template=Exam%20Preparation` pre-fills topic
4. Fill in name + YouTube URL → click "Begin Session →"
5. Verify session page is dark (`#0F0F0F`), frosted glass overlays show
6. Let webcam analyze for 30s, verify emotion pill + focus score update
7. Click "End Session" → verify redirect to `/report/:id`
8. Verify report page: white bg, score ring, emotion breakdown, behavior timeline dots, chart

**Step 4: Production build check**

```bash
cd frontend && npm run build
```
Expected: build completes with no errors.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Notion-style frontend redesign with templates, testimonials, and frosted glass session"
```
