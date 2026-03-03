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
