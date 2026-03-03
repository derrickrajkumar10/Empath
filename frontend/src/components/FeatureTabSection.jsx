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
