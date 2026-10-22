import { Globe2, Radar, Car, UserSearch, ImageDown, Search, FileStack } from 'lucide-react'

export const MODULES = [
  { id: 'domain',   label: 'Domain',    icon: Globe2,     ph: 'example.com',        kind: 'text', desc: 'WHOIS, DNS records, live headers & risk score' },
  { id: 'ip',       label: 'IP Address',icon: Radar,      ph: '8.8.8.8',            kind: 'text', desc: 'Geolocation, reverse DNS & hosting risk score' },
  { id: 'vehicle',  label: 'Vehicle',   icon: Car,        ph: 'GJ01AB1234',         kind: 'text', desc: 'Run the vehicle backend command and capture its complete terminal output' },
  { id: 'username', label: 'Username',  icon: UserSearch, ph: 'johndoe',            kind: 'text', desc: 'Cross-platform footprint & identity confidence' },
  { id: 'metadata', label: 'Metadata',  icon: ImageDown,  ph: 'Upload image file',  kind: 'file', desc: 'EXIF & embedded file metadata extraction' },
  { id: 'dork',     label: 'Dork Gen',  icon: Search,     ph: 'example.com',        kind: 'text', desc: 'Auto-generated Google dork queries' },
  { id: 'report',   label: 'Report',    icon: FileStack,  ph: '',                   kind: 'report', desc: 'Combine module results into one intel report' },
]

export function moduleById(id) {
  return MODULES.find((m) => m.id === id)
}
