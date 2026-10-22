import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = {
  domain:   ['Querying WHOIS registry…', 'Resolving DNS records…', 'Reading live HTTP headers…', 'Scoring risk signals…'],
  ip:       ['Requesting geolocation…', 'Resolving reverse DNS…', 'Scoring host risk…'],
  vehicle:  ['Parsing plate format…', 'Matching state/RTO code…', 'Scoring confidence…'],
  username: ['Sweeping platform directory…', 'Checking 15 networks in parallel…', 'Computing identity confidence…'],
  metadata: ['Reading image container…', 'Extracting EXIF tags…'],
  dork:     ['Building search operators…', 'Compiling dork categories…'],
  report:   ['Merging module results…', 'Building entity graph…', 'Drafting narrative summary…'],
}

export default function ScanLoader({ type }) {
  const steps = STEPS[type] || ['Scanning target…']
  const [i, setI] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % steps.length), 900)
    return () => clearInterval(t)
  }, [steps.length])

  return (
    <div className="rounded-xl border border-line bg-panel/60 py-14 px-8 flex flex-col items-center gap-5">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <span className="absolute inline-flex h-full w-full rounded-full border border-signal/30 animate-pulse-ring" />
        <span className="absolute inline-flex h-full w-full rounded-full border border-signal/30 animate-pulse-ring" style={{ animationDelay: '0.6s' }} />
        <div className="w-3 h-3 rounded-full bg-signal" />
      </div>
      <div className="h-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="font-mono text-xs text-muted tracking-wide"
          >
            {steps[i]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="w-full max-w-xs h-1 bg-panel-2 rounded-full overflow-hidden border border-line">
        <motion.div
          className="h-full bg-signal"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '40%' }}
        />
      </div>
    </div>
  )
}
