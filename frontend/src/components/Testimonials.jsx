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
