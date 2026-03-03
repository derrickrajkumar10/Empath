import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import WordBuildHero from '../components/WordBuildHero'
import SessionMockup from '../components/SessionMockup'
import FeatureTabSection from '../components/FeatureTabSection'
import StudyTemplates from '../components/StudyTemplates'
import Testimonials from '../components/Testimonials'

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
