import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
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

function FocusChartSection({ chartData, emotion }) {
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

export default function SessionPage() {
  const navigate = useNavigate()
  const { sessionId, topic, videoUrl, clearSession } = useSession()
  const { videoRef, canvasRef, hasPermission, stream, requestPermission, captureFrame, stopStream } = useWebcam()

  const [emotion, setEmotion] = useState('neutral')
  const [focusScore, setFocusScore] = useState(70)
  const [phoneDetected, setPhoneDetected] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [chartData, setChartData] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isEnding, setIsEnding] = useState(false)

  const recentEventsRef = useRef([])
  const lastSuggestionStateRef = useRef(null)
  const lastSuggestionTimeRef = useRef(0)
  const analyzeIntervalRef = useRef(null)
  const timerRef = useRef(null)
  const elapsedRef = useRef(0)

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) navigate('/start')
  }, [sessionId])

  // Request webcam + start elapsed timer on mount
  useEffect(() => {
    requestPermission()
    timerRef.current = setInterval(() => {
      setElapsedSeconds(s => {
        elapsedRef.current = s + 1
        return s + 1
      })
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

    const ts = elapsedRef.current

    try {
      const emotionResult = await analyzeEmotion(blob)
      const detectedEmotion = emotionResult.emotion
      const detectedConf = emotionResult.confidence
      const detectedPhone = emotionResult.phone_detected

      setEmotion(detectedEmotion)

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
      setChartData(prev => [...prev.slice(-60), { time: ts, score, emotion: detectedEmotion }])

      // Suggest if score < 45, state changed, and at least 60s since last suggestion
      const timeSinceLast = ts - lastSuggestionTimeRef.current
      if (score < 45 && state !== lastSuggestionStateRef.current && timeSinceLast >= 60) {
        lastSuggestionStateRef.current = state
        lastSuggestionTimeRef.current = ts
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
              {/* Always mounted so videoRef is set before requestPermission runs */}
              <video
                ref={videoRef}
                autoPlay muted playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              {!hasPermission && (
                <div className="absolute inset-0 flex items-center justify-center text-2xl"
                     style={{ background: '#1A1A1A' }}>🔒</div>
              )}
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
}
