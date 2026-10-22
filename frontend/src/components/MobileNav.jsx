import { motion } from 'framer-motion'
import { MODULES } from '../lib/modules'

// App-like bottom tab bar for mobile — replaces the old horizontal scroll strip.
// Shows the 5 most-used modules directly; the rest live behind "More".
const PRIMARY_IDS = ['domain', 'ip', 'username', 'metadata', 'report']

export default function MobileNav({ active, onChange, onMore, moreOpen }) {
  const primary = PRIMARY_IDS.map((id) => MODULES.find((m) => m.id === id)).filter(Boolean)

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-panel/95 backdrop-blur-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch">
        {primary.map((m) => {
          const Icon = m.icon
          const isActive = !moreOpen && active === m.id
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.id)}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] active:scale-95 transition-transform"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-signal"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <Icon size={19} strokeWidth={1.75} className={isActive ? 'text-signal' : 'text-muted'} />
              <span className={'font-mono text-[9.5px] tracking-tight ' + (isActive ? 'text-signal' : 'text-faint')}>
                {m.label}
              </span>
            </button>
          )
        })}
        <button
          onClick={onMore}
          className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] active:scale-95 transition-transform"
        >
          {moreOpen && (
            <motion.div
              layoutId="mobile-nav-active"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-signal"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            />
          )}
          <div className={'w-[19px] h-[19px] grid grid-cols-3 gap-[2px] place-items-center'}>
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className={'w-[3px] h-[3px] rounded-full ' + (moreOpen ? 'bg-signal' : 'bg-muted')} />
            ))}
          </div>
          <span className={'font-mono text-[9.5px] ' + (moreOpen ? 'text-signal' : 'text-faint')}>More</span>
        </button>
      </div>
    </nav>
  )
}
