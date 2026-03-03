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
