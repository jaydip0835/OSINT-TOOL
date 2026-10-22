import { motion } from 'framer-motion'
import { Activity, CarFront, CheckCircle2, Clock3, Copy, ExternalLink, Server, TerminalSquare } from 'lucide-react'
import { Card, Row, Badge, ConfidenceGauge, EmptyNote, RiskGauge } from './ui'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

export function DomainView({ data }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
      <Card title="WHOIS">
        <Row label="Registrar" value={data.whois && data.whois.registrar} />
        <Row label="Country" value={data.whois && data.whois.country} />
        <Row label="Created" value={data.whois && data.whois.creation_date} />
        <Row label="Expires" value={data.whois && data.whois.expiration_date} />
        <Row label="Name Servers" value={data.whois && data.whois.name_servers && [].concat(data.whois.name_servers).join(', ')} />
      </Card>
      <Card title="DNS Records">
        <Row label="A Records" value={data.dns && data.dns.A && data.dns.A.join(', ')} />
        <Row label="AAAA Records" value={data.dns && data.dns.AAAA && data.dns.AAAA.join(', ')} />
        <Row label="MX Records" value={data.dns && data.dns.MX && data.dns.MX.join(', ')} />
        <Row label="NS Records" value={data.dns && data.dns.NS && data.dns.NS.join(', ')} />
        <Row label="CAA Records" value={data.dns && data.dns.CAA && data.dns.CAA.join(', ')} />
        <Row label="TXT Records" value={data.dns && data.dns.TXT && data.dns.TXT.join(', ')} />
      </Card>
      <Card title="Network">
        <Row label="IP Address" value={typeof data.ip_address === 'string' ? data.ip_address : data.ip_address?.error} />
        <Row label="Status Code" value={data.status_code} />
        <Row label="Server" value={data.http_headers && data.http_headers.server} />
      </Card>
      <Card title="HTTP Security Headers">
        {data.security_headers && Object.keys(data.security_headers).length > 0 ? (
          Object.entries(data.security_headers).map(([name, value]) => <Row key={name} label={name} value={value} mono={false} />)
        ) : <EmptyNote>No security headers were observed in the response, or the header check was unavailable.</EmptyNote>}
        {data.missing_security_headers && data.missing_security_headers.length > 0 && (
          <Row label="Not observed" value={data.missing_security_headers.join(', ')} mono={false} />
        )}
      </Card>
      <Card title="Risk Assessment">
        <RiskGauge risk={data.risk_assessment} />
      </Card>
    </motion.div>
  )
}

export function IpView({ data }) {
  const g = data.geolocation || {}
  const c = data.classification || {}
  const hasCoords = typeof g.lat === 'number' && typeof g.lon === 'number'
  const mapsUrl = hasCoords ? `https://www.google.com/maps?q=${g.lat},${g.lon}` : null
  const embedUrl = hasCoords
    ? `https://maps.google.com/maps?q=${g.lat},${g.lon}&z=10&output=embed`
    : null

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
      <Card title="Classification" eyebrow={data.lookup_time_ms ? data.lookup_time_ms + ' ms' : undefined}>
        <Row label="IP Version" value={c.version && 'IPv' + c.version} />
        <Row label="Scope" value={
          [
            c.is_private && 'Private',
            c.is_global && 'Global/Public',
            c.is_loopback && 'Loopback',
            c.is_link_local && 'Link-local',
            c.is_multicast && 'Multicast',
            c.is_reserved && 'Reserved',
          ].filter(Boolean).join(', ') || undefined
        } />
        <Row label="Reverse DNS" value={typeof data.reverse_dns === 'string' ? data.reverse_dns : data.reverse_dns?.error} />
      </Card>
      <Card title="Geolocation">
        {g.note ? <EmptyNote>{g.note}</EmptyNote> : (
          <>
            <Row label="Country" value={g.country} />
            <Row label="Region" value={g.regionName} />
            <Row label="City" value={g.city} />
            <Row label="Latitude" value={hasCoords ? g.lat : undefined} />
            <Row label="Longitude" value={hasCoords ? g.lon : undefined} />
            <Row label="ISP" value={g.isp} />
            <Row label="Org" value={g.org} />
            <Row label="ASN" value={g.as} />
            <Row label="Timezone" value={g.timezone} />
            <Row label="Mobile" value={g.mobile !== undefined ? (g.mobile ? 'Yes' : 'No') : undefined} />
            <Row label="Hosting/Datacenter" value={g.hosting !== undefined ? (g.hosting ? 'Yes' : 'No') : undefined} />
            <Row label="Proxy/VPN" value={g.proxy !== undefined ? (g.proxy ? 'Yes' : 'No') : undefined} />
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noreferrer"
                className="inline-block mt-2 text-signal text-xs font-mono underline">
                View on Google Maps →
              </a>
            )}
            {g.error && <EmptyNote>{g.error}</EmptyNote>}
          </>
        )}
      </Card>
      {embedUrl && (
        <Card title="Map" eyebrow="approximate — IP geolocation, not exact address" className="sm:col-span-2">
          <div className="rounded-lg overflow-hidden border border-line-soft">
            <iframe
              title="ip-location-map"
              src={embedUrl}
              width="100%"
              height="260"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </Card>
      )}
      <Card title="Risk Assessment" className="sm:col-span-2">
        <RiskGauge risk={data.risk_assessment} />
      </Card>
    </motion.div>
  )
}

export function VehicleView({ data = {}, vehicle }) {
  const rawOutput = data.output ?? data.terminal_output ?? ''
  const outputText = Array.isArray(rawOutput)
    ? rawOutput.join('\n')
    : String(rawOutput || '')

  const cleanOutput = outputText.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '')
  const plate = (vehicle || data.rc || data.scan_metadata?.target || '').toUpperCase()

  return (
    <motion.div initial="hidden" animate="show" className="grid gap-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-line bg-panel/75"
      >
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-signal/25 bg-signal/10 text-signal">
              <TerminalSquare size={18} />
            </div>
            <div>
              <div className="font-display text-sm font-semibold text-text">Vehicle CMD Output</div>
              <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
                {plate || 'VEHICLE LOOKUP'} · vehicle_lookup.py stdout
              </div>
            </div>
          </div>

          {cleanOutput && (
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(cleanOutput)}
              className="flex items-center gap-1.5 self-start rounded-md border border-line px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-faint transition hover:border-signal/35 hover:text-text sm:self-auto"
            >
              <Copy size={11} /> Copy Output
            </button>
          )}
        </div>

        <div className="bg-[#05080b] p-3 sm:p-4">
          {cleanOutput ? (
            <pre className="max-h-[620px] min-h-[360px] overflow-auto whitespace-pre font-mono text-[11px] leading-[1.45] text-[#d7e0ea] sm:text-xs">
              {cleanOutput}
            </pre>
          ) : (
            <div className="flex min-h-[360px] items-center justify-center font-mono text-xs text-muted">
              Backend responded without CMD stdout.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function UsernameView({ results }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
      <Card title="Summary" eyebrow={results.scan_time_ms ? results.scan_time_ms + ' ms' : undefined}>
        <Row label="Total Checked" value={results.total_checked} />
        <Row label="Found On" value={results.found_count + ' platforms'} />
      </Card>
      <Card title="Identity Confidence">
        <ConfidenceGauge conf={results.identity_confidence} />
      </Card>
      <Card title="Found On" className="sm:col-span-2">
        <div className="flex flex-wrap gap-2">
          {results.found && results.found.length > 0 ? results.found.map((item, idx) => (
            <a key={idx} href={item.url} target="_blank" rel="noreferrer">
              <Badge tone="signal">{item.platform}</Badge>
            </a>
          )) : <EmptyNote>No matches found.</EmptyNote>}
        </div>
      </Card>
      <Card title="Not Found" className="sm:col-span-2">
        <div className="flex flex-wrap gap-2">
          {results.not_found && results.not_found.map((item, idx) => (
            <Badge key={idx}>{item.platform}</Badge>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

export function MetadataView({ data }) {
  const d = data.data || {}
  const exif = d.exif || {}
  const gps = d.gps_location || {}
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
      <Card title="File Info">
        {d.error ? <EmptyNote>{d.error}</EmptyNote> : (
          <>
            <Row label="Filename" value={d.filename} />
            <Row label="Format" value={d.format} />
            <Row label="Mode" value={d.mode} />
            <Row label="Size" value={d.size && d.size.width + ' × ' + d.size.height + ' px'} />
            <Row label="File Size" value={d.file_size_bytes && (d.file_size_bytes / 1024).toFixed(1) + ' KB'} />
            <Row label="MD5" value={d.hashes && d.hashes.md5} />
            <Row label="SHA-256" value={d.hashes && d.hashes.sha256} />
          </>
        )}
      </Card>
      <Card title="GPS Location">
        {gps.info ? <EmptyNote>{gps.info}</EmptyNote> : (
          <>
            <Row label="Latitude" value={gps.latitude} />
            <Row label="Longitude" value={gps.longitude} />
            <Row label="Altitude" value={gps.altitude_m !== undefined && gps.altitude_m + ' m'} />
            {gps.maps_url && (
              <a href={gps.maps_url} target="_blank" rel="noreferrer"
                className="inline-block mt-2 text-signal text-xs font-mono underline">
                View on Google Maps →
              </a>
            )}
          </>
        )}
      </Card>
      <Card title="EXIF Data" className="sm:col-span-2">
        {Object.keys(exif).length > 0 && !exif.info
          ? Object.keys(exif).map((key, idx) => <Row key={idx} label={key} value={exif[key]} />)
          : <EmptyNote>No EXIF data found in this image.</EmptyNote>}
      </Card>
    </motion.div>
  )
}

export function DorkView({ results }) {
  const dorks = results.dorks || {}
  const categories = Object.keys(dorks)

  function openGoogle(dork) {
    window.open('https://www.google.com/search?q=' + encodeURIComponent(dork), '_blank')
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4">
      <Card title="Summary">
        <Row label="Target" value={results.target} />
        <Row label="Total Dorks" value={results.total_dorks} />
      </Card>
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((cat, idx) => (
          <Card key={idx} title={cat.replace(/_/g, ' ')}>
            <div className="flex flex-col gap-2">
              {dorks[cat].map((dork, i) => (
                <div key={i} className="flex items-center justify-between gap-2 bg-panel-2 rounded-lg px-3 py-2 border border-line-soft">
                  <span className="text-signal text-xs flex-1 break-all font-mono">{dork}</span>
                  <button
                    onClick={() => openGoogle(dork)}
                    className="bg-signal/10 hover:bg-signal/20 border border-signal/30 text-signal text-[11px] font-mono font-medium px-3 py-1 rounded shrink-0 transition-colors"
                  >
                    Search
                  </button>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}

const NODE_COLOR = {
  target: '#f2a94d', domain: '#4fd8c4', ip: '#4fd8c4',
  vehicle: '#4fd8c4', username: '#4fd8c4', platform: '#8b98a9',
}

export function ReportView({ report }) {
  const graph = report.graph || { nodes: [], edges: [] }
  const nodes = graph.nodes || []
  const edges = graph.edges || []

  // simple circular layout for the entity graph
  const cx = 200, cy = 140, r = 105
  const positions = {}
  const others = nodes.filter((n) => n.id !== 'target')
  others.forEach((n, i) => {
    const angle = (i / Math.max(others.length, 1)) * Math.PI * 2 - Math.PI / 2
    positions[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
  if (nodes.some((n) => n.id === 'target')) positions['target'] = { x: cx, y: cy }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2">
      <Card title="Overall Risk">
        <RiskGauge risk={{
          risk_score: report.overall_risk?.composite_score ?? 0,
          risk_label: report.overall_risk?.label ?? 'Insufficient Data',
        }} />
      </Card>

      <Card title="Entity Graph" eyebrow={nodes.length + ' nodes'}>
        {nodes.length === 0 ? (
          <EmptyNote>Run some modules first, then generate a report to see relationships.</EmptyNote>
        ) : (
          <svg viewBox="0 0 400 280" className="w-full h-56">
            {edges.map((e, i) => {
              const a = positions[e.source], b = positions[e.target]
              if (!a || !b) return null
              return (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="var(--color-line)" strokeWidth="1" />
              )
            })}
            {nodes.map((n) => {
              const p = positions[n.id]
              if (!p) return null
              return (
                <g key={n.id}>
                  <circle cx={p.x} cy={p.y} r={n.id === 'target' ? 8 : 5.5}
                    fill={NODE_COLOR[n.type] || '#8b98a9'} opacity="0.9" />
                  <text x={p.x} y={p.y + 16} textAnchor="middle" fontSize="8"
                    fontFamily="JetBrains Mono, monospace" fill="var(--color-muted)">
                    {String(n.label).slice(0, 14)}
                  </text>
                </g>
              )
            })}
          </svg>
        )}
      </Card>

      <Card title="Narrative Summary" className="sm:col-span-2">
        <pre className="whitespace-pre-wrap text-xs text-muted font-mono leading-relaxed">
          {report.narrative_summary}
        </pre>
      </Card>
    </motion.div>
  )
}
