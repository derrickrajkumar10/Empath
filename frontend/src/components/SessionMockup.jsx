import { motion } from 'framer-motion'

export default function SessionMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-lg"
      style={{
        animation: 'float 5s ease-in-out infinite',
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* Browser chrome */}
      <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
           style={{ background: '#0F0F0F' }}>
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 mx-4 bg-gray-800 rounded-md px-3 py-1 text-gray-400 text-xs text-center">
            empath.app/session
          </div>
        </div>

        {/* Session UI mockup */}
        <div className="relative p-4" style={{ background: '#0F0F0F' }}>
          {/* Top bar mockup */}
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                <span className="text-black font-bold text-xs">E</span>
              </div>
              <span className="text-white text-xs font-medium">Introduction to ML</span>
            </div>
            <span className="text-white font-mono text-sm">12:34</span>
          </div>

          {/* Video area */}
          <div className="relative rounded-xl overflow-hidden mb-3"
               style={{ aspectRatio: '16/9', background: '#1a1a2e' }}>
            {/* Fake video content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white/80 border-b-[8px] border-b-transparent ml-1" />
              </div>
            </div>

            {/* Focus score overlay */}
            <div className="absolute top-3 right-3 flex flex-col items-center"
                 style={{ background: 'rgba(15,15,15,0.7)', backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '6px 10px' }}>
              <svg width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="18" fill="none" stroke="#2A2A2A" strokeWidth="4" />
                <circle cx="22" cy="22" r="18" fill="none" stroke="#4ADE80" strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 18}`}
                        strokeDashoffset={`${2 * Math.PI * 18 * 0.18}`}
                        transform="rotate(-90 22 22)" />
              </svg>
              <span className="text-white font-bold text-xs absolute top-1/2 -translate-y-1/2">82</span>
              <span className="text-gray-400 text-xs mt-0.5">Focus</span>
            </div>

            {/* Emotion pill overlay */}
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-black"
                 style={{ background: '#4ADE80' }}>
              😊 focused
            </div>

            {/* Webcam bubble */}
            <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full overflow-hidden border-2 border-green-400"
                 style={{ background: '#1a1a2e' }}>
              <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
            </div>
          </div>

          {/* Mini chart */}
          <div className="rounded-lg p-2" style={{ background: '#1A1A1A', border: '1px solid #2A2A2A' }}>
            <div className="flex items-end gap-0.5 h-8">
              {[65, 70, 72, 68, 75, 78, 80, 82, 79, 82, 85, 82].map((v, i) => (
                <div key={i} className="flex-1 rounded-sm" style={{
                  height: `${(v / 100) * 100}%`,
                  background: i === 11 ? '#4ADE80' : 'rgba(74,222,128,0.3)',
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
