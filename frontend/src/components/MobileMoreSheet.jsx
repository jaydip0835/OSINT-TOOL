import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { MODULES } from '../lib/modules'

export default function MobileMoreSheet({ open, onClose, active, onChange }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="md:hidden fixed inset-0 bg-black/60 z-50"
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-panel border-t border-line rounded-t-2xl px-5 pt-4"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
          >
            <div className="w-10 h-1 rounded-full bg-line mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-signal">All Modules</span>
              <button onClick={onClose}><X size={18} className="text-muted" /></button>
            </div>
            <div className="grid grid-cols-4 gap-3 pb-2">
              {MODULES.map((m) => {
                const Icon = m.icon
                const isActive = active === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => onChange(m.id)}
                    className={
                      'flex flex-col items-center gap-1.5 py-3 rounded-xl border active:scale-95 transition-all ' +
                      (isActive ? 'bg-signal/10 border-signal/40' : 'border-line')
                    }
                  >
                    <Icon size={20} strokeWidth={1.75} className={isActive ? 'text-signal' : 'text-muted'} />
                    <span className={'font-mono text-[10px] ' + (isActive ? 'text-signal' : 'text-muted')}>
                      {m.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
