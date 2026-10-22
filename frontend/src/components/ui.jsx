import { motion } from 'framer-motion'

export function Card({ title, eyebrow, children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={'card-glow bg-panel/80 backdrop-blur rounded-xl p-5 ' + className}
    >
      {(title || eyebrow) && (
        <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-line-soft">
          <span className="text-signal font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">{title}</span>
          {eyebrow && <span className="text-faint font-mono text-[10px] uppercase tracking-wider">{eyebrow}</span>}
        </div>
      )}
      {children}
    </motion.div>
  )
}

export function Row({ label, value, mono = true }) {
  if (value === undefined || value === null || value === '') return null
  return (
    <div className="flex gap-3 py-2 border-b border-line-soft/60 last:border-0 items-start">
      <span className="text-muted text-xs w-32 shrink-0 pt-0.5">{label}</span>
      <span className={'text-text text-xs break-all leading-relaxed ' + (mono ? 'font-mono' : '')}>{String(value)}</span>
    </div>
  )
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-panel-2 text-muted border-line',
    signal:  'bg-signal/10 text-signal border-signal/30',
    alert:   'bg-alert/10 text-alert border-alert/30',
    danger:  'bg-danger/10 text-danger border-danger/30',
  }
  return (
    <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border ' + tones[tone]}>
      {children}
    </span>
  )
}

export function EmptyNote({ children }) {
  return <span className="text-faint text-xs font-mono">{children}</span>
}

function toneForLabel(label = '') {
  const l = label.toLowerCase()
  if (l.includes('high')) return 'danger'
  if (l.includes('medium') || l.includes('possibly')) return 'alert'
  if (l.includes('unknown')) return 'neutral'
  return 'signal'
}

export function RiskGauge({ risk }) {
  if (!risk) return null
  if (risk.error) {
    return <div className="text-faint text-xs font-mono">Risk model unavailable: {risk.error}</div>
  }
  const score = risk.risk_score ?? 0
  const label = risk.risk_label || 'Unknown'
  const tone = toneForLabel(label)
  const barColor = tone === 'danger' ? 'var(--color-danger)' : tone === 'alert' ? 'var(--color-alert)' : 'var(--color-signal)'

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Badge tone={tone}>{label}</Badge>
        <motion.span
          className="font-mono font-mono-tabular text-sm text-text"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        >
          {score}<span className="text-faint">/100</span>
        </motion.span>
      </div>
      <div className="h-2 w-full bg-panel-2 rounded-full overflow-hidden border border-line">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          initial={{ width: 0 }}
          animate={{ width: score + '%' }}
          transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1], delay: 0.15 }}
        />
      </div>
      {risk.contributing_factors && risk.contributing_factors.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {risk.contributing_factors.map((f, i) => (
            <li key={i} className="text-xs text-muted flex gap-2">
              <span className="text-faint mt-0.5">›</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ConfidenceGauge({ conf }) {
  if (!conf) return null
  const score = conf.confidence_score ?? 0
  const label = conf.confidence_label || 'Unknown'
  const tone = score >= 70 ? 'signal' : score >= 40 ? 'alert' : 'neutral'
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Badge tone={tone}>{label}</Badge>
        <span className="font-mono font-mono-tabular text-sm text-text">{score}<span className="text-faint">/100</span></span>
      </div>
      <div className="h-2 w-full bg-panel-2 rounded-full overflow-hidden border border-line mb-3">
        <motion.div
          className="h-full rounded-full bg-signal"
          initial={{ width: 0 }}
          animate={{ width: score + '%' }}
          transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1] }}
        />
      </div>
      {conf.reasoning && <p className="text-xs text-muted leading-relaxed">{conf.reasoning}</p>}
    </div>
  )
}
