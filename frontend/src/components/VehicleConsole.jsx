import { motion } from 'framer-motion'
import { CarFront, Play, ShieldCheck, TerminalSquare } from 'lucide-react'

function cleanPlate(value) {
  return value.toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 16)
}

export default function VehicleConsole({ query, setQuery, loading, error, onSubmit }) {
  const canRun = query.trim().length >= 4 && !loading

  return (
    <section className="vehicle-console-shell overflow-hidden rounded-2xl border border-line bg-panel/80">
      <div className="relative overflow-hidden border-b border-line px-4 py-4 sm:px-5">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute inset-0 bg-radial-fade opacity-70" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-signal/25 bg-signal/10 text-signal">
              <CarFront size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-semibold tracking-wide text-text sm:text-base">Vehicle Intelligence Console</h2>
                <span className="hidden rounded border border-signal/25 bg-signal/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-signal sm:inline-flex">
                  CMD Bridge
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">Run a fixed vehicle lookup command through the backend and display its complete console output.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="flex items-center gap-1.5 rounded-md border border-line bg-ink/60 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
              <ShieldCheck size={12} className="text-signal" /> Fixed command only
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); if (canRun) onSubmit() }} className="p-4 sm:p-5">
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
          Registration Number
        </label>

        <div className="group flex flex-col gap-3 sm:flex-row">
          <div className="flex min-w-0 flex-1 items-center rounded-xl border border-line bg-[#060a0f] px-4 py-3.5 transition focus-within:border-signal/55 focus-within:ring-1 focus-within:ring-signal/20">
            <TerminalSquare size={15} className="mr-3 shrink-0 text-signal" />
            <span className="mr-2 hidden shrink-0 font-mono text-xs text-faint md:inline">C:\\OSINT-X\\vehicle&gt;</span>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(cleanPlate(e.target.value))}
              placeholder="GJ01AB1234"
              disabled={loading}
              autoComplete="off"
              spellCheck="false"
              aria-label="Vehicle registration number"
              className="min-w-0 flex-1 bg-transparent font-mono text-sm uppercase tracking-[0.08em] text-text placeholder:normal-case placeholder:tracking-normal placeholder:text-faint focus:outline-none disabled:opacity-50"
            />
            <motion.span
              className="ml-2 h-4 w-1.5 shrink-0 bg-signal/80"
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          </div>

          <button
            type="submit"
            disabled={!canRun}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-signal px-6 font-mono text-sm font-semibold text-ink transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Play size={15} fill="currentColor" />
            {loading ? 'Running…' : 'Run Scan'}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[10px] text-faint">
          <span>EXAMPLE: GJ01AB1234</span>
          <span className="hidden h-1 w-1 rounded-full bg-line sm:block" />
          <span>OUTPUT: FULL TERMINAL RESPONSE</span>
          <span className="hidden h-1 w-1 rounded-full bg-line sm:block" />
          <span>DEPLOYMENT: RENDER READY</span>
        </div>

        {loading && (
          <div className="mt-4 overflow-hidden rounded-lg border border-signal/20 bg-signal/[0.04]">
            <div className="relative h-px w-full bg-line-soft">
              <motion.div
                className="absolute inset-y-0 w-1/3 bg-signal"
                initial={{ x: '-110%' }}
                animate={{ x: '330%' }}
                transition={{ duration: 1.35, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2.5 font-mono text-xs text-signal">
              <span className="animate-blink">●</span>
              Executing vehicle backend command…
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="mt-4 rounded-lg border border-alert/25 bg-alert/[0.06] px-3 py-2.5 font-mono text-xs text-alert">
            [-] {error}
          </div>
        )}
      </form>
    </section>
  )
}
