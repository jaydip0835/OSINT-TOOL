import { useEffect, useState } from 'react'

export default function TopBar() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-line">
      <div className="flex items-baseline gap-3">
        <h1 className="font-display font-bold text-lg tracking-tight text-text">
          OSINT<span className="text-signal">-X</span>
        </h1>
        <span className="hidden sm:inline text-faint font-mono text-[10px] uppercase tracking-[0.2em]">
          Advanced Investigation Console
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline font-mono text-[11px] text-faint">
          {time.toLocaleTimeString()}
        </span>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-panel-2 border border-line">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-signal"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-signal"></span>
          </span>
          <span className="font-mono text-[10px] text-muted uppercase tracking-wider">Online</span>
        </div>
      </div>
    </header>
  )
}
