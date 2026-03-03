import { motion } from 'framer-motion'

const EMOTION_COLORS = {
  focused:    '#4ADE80',
  neutral:    '#FACC15',
  confused:   '#FB923C',
  bored:      '#F472B6',
  distressed: '#F87171',
}

const EMOTION_EMOJI = {
  focused: '😊', neutral: '😐', confused: '🤔', bored: '😴', distressed: '😟'
}

export default function EmotionPill({ emotion, className = '' }) {
  const color = EMOTION_COLORS[emotion] || '#888'
  const emoji = EMOTION_EMOJI[emotion] || '•'

  return (
    <motion.div
      key={emotion}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-black ${className}`}
      style={{ backgroundColor: color }}
    >
      <span>{emoji}</span>
      <span className="capitalize">{emotion}</span>
    </motion.div>
  )
}

export { EMOTION_COLORS, EMOTION_EMOJI }
