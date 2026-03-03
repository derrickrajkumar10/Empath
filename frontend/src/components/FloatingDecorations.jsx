import { motion } from 'framer-motion'

const DECORATIONS = [
  { label: '😊 focused',    color: '#4ADE80', x: '8%',  y: '20%', delay: 0 },
  { label: '😐 neutral',    color: '#FACC15', x: '85%', y: '30%', delay: 1.2 },
  { label: '🤔 confused',   color: '#FB923C', x: '12%', y: '65%', delay: 0.8 },
  { label: '😴 bored',      color: '#F472B6', x: '80%', y: '70%', delay: 2 },
  { label: '😟 distressed', color: '#F87171', x: '50%', y: '15%', delay: 1.5 },
]

export default function FloatingDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {DECORATIONS.map((d, i) => (
        <motion.div
          key={i}
          className="absolute px-4 py-2 rounded-full text-sm font-semibold text-black select-none"
          style={{ backgroundColor: d.color, left: d.x, top: d.y }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0, 1, 1, 0.8, 1],
            y: [0, -14, 0, -8, 0],
            scale: [0.8, 1, 1, 1, 1],
          }}
          transition={{
            duration: 4,
            delay: d.delay,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
        >
          {d.label}
        </motion.div>
      ))}
    </div>
  )
}
