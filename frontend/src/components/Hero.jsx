import { motion } from 'framer-motion'

export default function Hero({ moduleLabel, moduleDesc }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-panel/60 bg-grid bg-radial-fade py-14 px-8 text-center">
      {/* signature signal trace */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px overflow-hidden opacity-70">
        <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="w-full h-10">
          <polyline
            points="0,20 30,20 40,6 50,34 60,20 90,20 100,4 108,36 116,20 400,20"
            fill="none"
            stroke="var(--color-signal)"
            strokeWidth="1"
            opacity="0.35"
          />
        </svg>
        <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-signal/60 to-transparent animate-trace" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        <span className="inline-block font-mono text-[10px] uppercase tracking-[0.25em] text-signal mb-4">
          Signal Acquired · {moduleLabel}
        </span>
        <h2 className="font-display font-semibold text-2xl sm:text-3xl text-text mb-3 text-glow">
          Turn scattered public data into one clear picture
        </h2>
        <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
          {moduleDesc}. Enter a target above and OSINT-X will correlate every open-source
          signal it can find, scored and ranked for you.
        </p>
      </motion.div>
    </div>
  )
}
