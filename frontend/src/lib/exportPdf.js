import { jsPDF } from 'jspdf'

export function exportResultsPDF(type, results, file) {
  if (!results) return
  const doc = new jsPDF()
  const target =
    results.domain || results.ip || results.vehicle || results.email ||
    results.username || results.target || results.rc || (file && file.name) || 'Unknown'

  doc.setFillColor(10, 14, 19)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(79, 216, 196)
  doc.setFontSize(22)
  doc.text('OSINT-X', 15, 18)
  doc.setFontSize(10)
  doc.setTextColor(200, 200, 200)
  doc.text('Investigation Report — ' + String(target), 15, 25)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  let y = 45

  function addSection(title, obj) {
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFontSize(13)
    doc.setTextColor(0, 130, 120)
    doc.text(title, 15, y)
    y += 7
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach((key) => {
        if (y > 270) { doc.addPage(); y = 20 }
        const val = String(obj[key]).slice(0, 100)
        doc.text(key + ': ' + val, 18, y)
        y += 6
      })
    } else {
      doc.text(String(obj), 18, y)
      y += 6
    }
    y += 4
  }

  if (type === 'domain' && results.data) {
    if (results.data.whois) addSection('WHOIS', results.data.whois)
    if (results.data.dns) addSection('DNS Records', results.data.dns)
    if (results.data.ip_address) addSection('Network', { ip: results.data.ip_address, server: results.data.http_headers && results.data.http_headers.server })
    if (results.data.risk_assessment) addSection('Risk Assessment', results.data.risk_assessment)
  } else if (type === 'ip' && results.data) {
    addSection('Classification', results.data.classification || {})
    addSection('Geolocation', results.data.geolocation || {})
    addSection('Reverse DNS', { hostname: results.data.reverse_dns })
    if (results.data.risk_assessment) addSection('Risk Assessment', results.data.risk_assessment)
  } else if (type === 'vehicle') {
    const vehicleData = results.data || results
    if (vehicleData.valid_format !== undefined || vehicleData.scheme) {
      addSection('Plate Format', {
        valid_format: vehicleData.valid_format,
        scheme: vehicleData.scheme,
        series: vehicleData.series,
        number: vehicleData.number,
      })
    }
    if (vehicleData.state_code) {
      addSection('State / RTO', {
        state_code: vehicleData.state_code,
        state_name: vehicleData.state_name,
        rto_code: vehicleData.rto_code,
        rto_name: vehicleData.rto_name,
      })
    }
    if (vehicleData.maker_model || vehicleData.model_name || vehicleData.fuel_type || vehicleData.vehicle_class) {
      addSection('Vehicle Details', { maker_model: vehicleData.maker_model, manufacturer: vehicleData.model_name, fuel_type: vehicleData.fuel_type, vehicle_class: vehicleData.vehicle_class })
    }
    if (vehicleData.registered_rto || vehicleData.city_name || vehicleData.registration_date || vehicleData.owner_serial_no) {
      addSection('Registration', { registered_rto: vehicleData.registered_rto, city: vehicleData.city_name, registration_date: vehicleData.registration_date, ownership: vehicleData.owner_serial_no })
    }
    if (vehicleData.fitness_upto || vehicleData.insurance_expiry || vehicleData.insurance_upto || vehicleData.puc_upto || vehicleData.tax_upto || vehicleData.insurance_no || vehicleData.puc_no) {
      addSection('Validity / Compliance', { fitness_upto: vehicleData.fitness_upto, insurance_company: vehicleData.insurance_company, insurance_expiry: vehicleData.insurance_expiry || vehicleData.insurance_upto, insurance_no: vehicleData.insurance_no, puc_upto: vehicleData.puc_upto, puc_no: vehicleData.puc_no, tax_upto: vehicleData.tax_upto })
    }
    if (vehicleData.synthetic_demo && (vehicleData.owner_name || vehicleData.phone || vehicleData.address)) {
      addSection('Synthetic Demo Owner / Contact', { owner_name: vehicleData.owner_name, phone: vehicleData.phone, address: vehicleData.address })
    }
    if (vehicleData.confidence) addSection('Confidence', vehicleData.confidence)
    const terminal = vehicleData.output || vehicleData.terminal_output
    if (terminal) {
      addSection('Command Output', Array.isArray(terminal) ? terminal.join('\n') : terminal)
    }
  } else if (type === 'username') {
    addSection('Summary', { total: results.total_checked, found: results.found_count + ' platforms' })
    if (results.found) {
      addSection('Found On', { platforms: results.found.map((r) => r.platform).join(', ') })
    }
    if (results.identity_confidence) addSection('Identity Confidence', results.identity_confidence)
  } else if (type === 'dork') {
    addSection('Summary', { target: results.target, total_dorks: results.total_dorks })
    const dorks = results.dorks || {}
    Object.keys(dorks).forEach((cat) => {
      addSection(cat.toUpperCase(), dorks[cat].reduce((acc, d, i) => {
        acc['dork_' + (i + 1)] = d
        return acc
      }, {}))
    })
  } else if (type === 'metadata' && results.data) {
    addSection('File Info', results.data)
    if (results.data.exif) addSection('EXIF Data', results.data.exif)
  } else if (type === 'report') {
    addSection('Overall Risk', results.overall_risk || {})
    if (y > 260) { doc.addPage(); y = 20 }
    doc.setFontSize(13)
    doc.setTextColor(0, 130, 120)
    doc.text('Narrative Summary', 15, y)
    y += 7
    doc.setFontSize(9.5)
    doc.setTextColor(50, 50, 50)
    const lines = doc.splitTextToSize(results.narrative_summary || '', 180)
    lines.forEach((line) => {
      if (y > 270) { doc.addPage(); y = 20 }
      doc.text(line, 18, y)
      y += 5
    })
  }

  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('OSINT-X — For Educational and Ethical Use Only', 15, 290)

  doc.save('OSINT-X-Report-' + target + '.pdf')
}
