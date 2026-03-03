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
