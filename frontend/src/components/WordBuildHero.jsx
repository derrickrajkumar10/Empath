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
