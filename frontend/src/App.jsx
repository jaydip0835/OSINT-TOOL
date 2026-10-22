import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Upload, FileDown, AlertCircle, X, FileStack } from 'lucide-react'

import { api, friendlyError, runVehicleLookup } from './lib/api'
import { MODULES, moduleById } from './lib/modules'
import { exportResultsPDF } from './lib/exportPdf'

import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import MobileNav from './components/MobileNav'
import MobileMoreSheet from './components/MobileMoreSheet'
import Hero from './components/Hero'
import ScanLoader from './components/ScanLoader'
import VehicleConsole from './components/VehicleConsole'
import { Badge } from './components/ui'
import {
  DomainView, IpView, VehicleView,
  UsernameView, MetadataView, DorkView, ReportView,
} from './components/views'

const VIEW_BY_TYPE = {
  domain: (r) => <DomainView data={r.data} />,
  ip: (r) => <IpView data={r.data} />,
  vehicle: (r, props) => <VehicleView data={r.data || r} vehicle={r.vehicle || r.rc || props.query} {...props} />,
  username: (r) => <UsernameView results={r} />,
  metadata: (r) => <MetadataView data={r} />,
  dork: (r) => <DorkView results={r} />,
  report: (r) => <ReportView report={r} />,
}

export default function App() {
  const [type, setType] = useState('domain')
  const [query, setQuery] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [history, setHistory] = useState({}) // { domain: {...}, ip: {...}, ... } cached results for report builder
  const [reportTarget, setReportTarget] = useState('')
  const [reportModules, setReportModules] = useState([])
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false)
  const fileInputRef = useRef(null)

  const current = moduleById(type)

  function changeType(id) {
    setType(id)
    setQuery('')
    setFile(null)
    setResults(null)
    setError(null)
    setMobileMoreOpen(false)
  }

  async function search() {
    setLoading(true)
    setResults(null)
    setError(null)

    try {
      if (type === 'metadata') {
        if (!file) { setError('Please select an image file.'); setLoading(false); return }
        const formData = new FormData()
        formData.append('file', file)
        const res = await api.post('/api/metadata/image', formData)
        setResults(res.data)
      } else {
        if (!query.trim()) { setLoading(false); return }
        const res = type === 'vehicle'
          ? await runVehicleLookup(query)
          : await api.get('/api/' + type + '/' + encodeURIComponent(query.trim()))
        setResults(res.data)
        setHistory((h) => ({ ...h, [type]: res.data }))
      }
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  async function generateReport() {
    setLoading(true)
    setResults(null)
    setError(null)
    try {
      const payload = { target: reportTarget || 'Investigation Target' }
      reportModules.forEach((m) => { if (history[m]) payload[m] = history[m] })
      const res = await api.post('/api/report/generate', payload)
      setResults(res.data)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  async function downloadReportPDF() {
    try {
      const payload = { target: reportTarget || 'Investigation Target' }
      reportModules.forEach((m) => { if (history[m]) payload[m] = history[m] })
      const res = await api.post('/api/report/pdf', payload, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'osint_x_report.pdf'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(friendlyError(err))
    }
  }

  function toggleReportModule(id) {
    setReportModules((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  const target = results && (
    results.domain || results.ip || results.vehicle || results.email ||
    results.username || results.target || results.rc || (file && file.name)
  )

  const availableModules = MODULES.filter((m) => m.id !== 'report')

  return (
    <div className="min-h-screen bg-ink text-text flex">
      <Sidebar active={type} onChange={changeType} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />

        <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 py-8 pb-24 md:pb-8">

          {/* input dock */}
          {type !== 'report' ? (
            <div className="mb-6">
              {type === 'vehicle' ? (
                <VehicleConsole
                  query={query}
                  setQuery={setQuery}
                  loading={loading}
                  error={error}
                  onSubmit={search}
                />
              ) : (
                <>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-faint mb-2">
                    Target &middot; {current.label}
                  </label>
                  {type === 'metadata' ? (
                    <div className="flex gap-3">
                      <label className="flex-1 flex items-center gap-3 bg-panel border border-line rounded-lg px-4 py-3 text-muted cursor-pointer hover:border-signal/50 transition-colors">
                        <Upload size={16} className="shrink-0" />
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                          onChange={(e) => setFile(e.target.files[0])} />
                        <span className="font-mono text-sm truncate">{file ? file.name : 'Click to select an image file…'}</span>
                      </label>
                      <button onClick={search} disabled={loading}
                        className="flex items-center gap-2 bg-signal text-ink font-mono font-semibold text-sm px-6 py-3 rounded-lg disabled:opacity-40 hover:brightness-110 transition">
                        <Search size={16} /> Scan
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <input
                        type="text" value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') search() }}
                        placeholder={current.ph}
                        className="flex-1 bg-panel border border-line rounded-lg px-4 py-3 text-text font-mono text-sm placeholder-faint focus:outline-none focus:border-signal/60 focus:ring-1 focus:ring-signal/30 transition-colors"
                      />
                      <button onClick={search} disabled={loading}
                        className="flex items-center gap-2 bg-signal text-ink font-mono font-semibold text-sm px-6 py-3 rounded-lg disabled:opacity-40 hover:brightness-110 transition">
                        <Search size={16} /> Scan
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="mb-6 rounded-xl border border-line bg-panel/60 p-5">
              <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-faint mb-2">
                Report Label
              </label>
              <input
                type="text" value={reportTarget}
                onChange={(e) => setReportTarget(e.target.value)}
                placeholder="e.g. example.com investigation"
                className="w-full bg-panel-2 border border-line rounded-lg px-4 py-2.5 text-text font-mono text-sm placeholder-faint focus:outline-none focus:border-signal/60 mb-4"
              />
              <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-faint mb-2">
                Include module results already scanned this session
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {availableModules.map((m) => {
                  const has = !!history[m.id]
                  const selected = reportModules.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      disabled={!has}
                      onClick={() => toggleReportModule(m.id)}
                      className={
                        'font-mono text-[11px] px-3 py-1.5 rounded-md border transition-colors ' +
                        (!has ? 'opacity-30 cursor-not-allowed border-line text-faint'
                          : selected ? 'bg-signal/10 border-signal/40 text-signal' : 'border-line text-muted hover:border-signal/30')
                      }
                    >
                      {m.label}{!has && ' (no data)'}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={generateReport} disabled={loading || reportModules.length === 0}
                  className="flex items-center gap-2 bg-signal text-ink font-mono font-semibold text-sm px-6 py-2.5 rounded-lg disabled:opacity-40 hover:brightness-110 transition">
                  <FileStack size={16} /> Generate Report
                </button>
                <button onClick={downloadReportPDF} disabled={reportModules.length === 0}
                  className="flex items-center gap-2 border border-line text-muted font-mono text-sm px-5 py-2.5 rounded-lg disabled:opacity-40 hover:border-signal/30 hover:text-text transition">
                  <FileDown size={16} /> PDF
                </button>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {type !== 'vehicle' && loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ScanLoader key={type} type={type} />
              </motion.div>
            )}

            {type !== 'vehicle' && !loading && error && (
              <motion.div key="error" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-start gap-3 bg-danger/10 border border-danger/30 rounded-lg px-4 py-3.5 text-danger text-sm">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)}><X size={16} /></button>
              </motion.div>
            )}

            {type !== 'vehicle' && !loading && !error && !results && (
              <motion.div key="hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Hero moduleLabel={current.label} moduleDesc={current.desc} />
              </motion.div>
            )}

            {!loading && results && (
              <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal">Results</span>
                  {target && <Badge>{String(target)}</Badge>}
                  <button onClick={() => exportResultsPDF(type, results, file)}
                    className="ml-auto flex items-center gap-2 border border-line hover:border-signal/40 text-muted hover:text-text font-mono text-xs px-4 py-2 rounded-lg transition-colors">
                    <FileDown size={14} /> Export PDF
                  </button>
                </div>
                {VIEW_BY_TYPE[type](results, { query, onSubmit: search, loading })}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="hidden md:block text-center text-faint text-[11px] font-mono py-6 border-t border-line">
          OSINT-X — For Educational and Ethical Use Only
        </footer>
      </div>

      <MobileNav
        active={type}
        onChange={changeType}
        onMore={() => setMobileMoreOpen((v) => !v)}
        moreOpen={mobileMoreOpen}
      />
      <MobileMoreSheet
        open={mobileMoreOpen}
        onClose={() => setMobileMoreOpen(false)}
        active={type}
        onChange={changeType}
      />
    </div>
  )
}
