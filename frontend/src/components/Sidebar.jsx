import { motion } from 'framer-motion'
import { MODULES } from '../lib/modules'

export default function Sidebar({ active, onChange }) {
  return (
    <aside className="hidden md:flex w-[76px] shrink-0 flex-col items-center border-r border-line py-6 gap-1 bg-panel/40">
      <div className="mb-6">
        <div className="w-9 h-9 rounded-lg bg-signal/10 border border-signal/30 flex items-center justify-center">
          <span className="text-signal font-mono font-bold text-sm">X</span>
        </div>
      </div>

      {MODULES.map((m) => {
        const Icon = m.icon
        const isActive = active === m.id
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            title={m.label}
            className="relative w-12 h-12 flex items-center justify-center rounded-lg group transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-lg bg-signal/10 border border-signal/40"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <Icon
              size={19}
              strokeWidth={1.75}
              className={
                'relative transition-colors ' +
                (isActive ? 'text-signal' : 'text-muted group-hover:text-text')
              }
            />
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap px-2.5 py-1.5 rounded-md bg-panel-2 border border-line text-[11px] font-mono text-text opacity-0 group-hover:opacity-100 transition-opacity z-30">
              {m.label}
            </span>
          </button>
        )
      })}
    </aside>
  )
}
