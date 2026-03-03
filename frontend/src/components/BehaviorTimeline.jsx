import { useState } from 'react'

const EVENT_COLORS = {
  pause:          '#FACC15',
  rewind:         '#FB923C',
  fast_forward:   '#818CF8',
  phone_detected: '#F87171',
  idle_start:     '#F472B6',
}

const EVENT_LABELS = {
  pause:          'Paused',
  rewind:         'Rewound',
  fast_forward:   'Fast forwarded',
  phone_detected: 'Phone detected',
  idle_start:     'Went idle',
}

export default function BehaviorTimeline({ events, durationSeconds }) {
  const [tooltip, setTooltip] = useState(null)

  if (!events || events.length === 0) {
    return (
      <div className="card-light">
        <h2 className="text-xs text-secondary uppercase tracking-widest mb-3">Behavior Events</h2>
        <p className="text-secondary text-sm">No behavior events recorded.</p>
      </div>
    )
  }

  const duration = durationSeconds || 1

  function formatTs(s) {
    const m = Math.floor(s / 60)
    const sec = Math.round(s) % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="card-light">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs text-secondary uppercase tracking-widest">Behavior Events</h2>
        <div className="flex items-center gap-3 text-xs text-secondary">
          {Object.entries(EVENT_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
              {EVENT_LABELS[type]?.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline bar */}
      <div className="relative h-8 bg-surface rounded-full overflow-visible">
        {/* Track */}
        <div className="absolute inset-y-0 left-0 right-0 bg-border-light rounded-full"
             style={{ top: '50%', transform: 'translateY(-50%)', height: 4 }} />

        {/* Dots */}
        {events.map((ev, i) => {
          const pct = Math.min(100, (ev.timestamp_seconds / duration) * 100)
          const color = EVENT_COLORS[ev.event_type] || '#9CA3AF'
          return (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full cursor-pointer border-2 border-white shadow-sm
                         transition-transform hover:scale-150"
              style={{
                left: `${pct}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: color,
                zIndex: 10,
              }}
              onMouseEnter={() => setTooltip({ ...ev, pct, color })}
              onMouseLeave={() => setTooltip(null)}
            />
          )
        })}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 px-3 py-2 rounded-lg shadow-lg text-xs pointer-events-none"
            style={{
              left: `${Math.min(85, tooltip.pct)}%`,
              top: -40,
              background: '#191919',
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: tooltip.color }}>●</span>{' '}
            {EVENT_LABELS[tooltip.event_type] || tooltip.event_type} at {formatTs(tooltip.timestamp_seconds)}
          </div>
        )}
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-2 text-xs text-secondary">
        <span>0:00</span>
        <span>{formatTs(duration / 2)}</span>
        <span>{formatTs(duration)}</span>
      </div>
    </div>
  )
}
