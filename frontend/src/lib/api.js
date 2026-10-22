import axios from 'axios'

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
export const VEHICLE_API_BASE = (import.meta.env.VITE_VEHICLE_API_BASE_URL || '').replace(/\/$/, '')

// Main OSINT-X backend used by the existing modules.
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 25000,
})

// Optional dedicated vehicle backend (for example a Render Web Service).
// When VITE_VEHICLE_API_BASE_URL is empty, the app keeps using the existing
// /api/vehicle/{plate} route on the main OSINT-X backend.
export const vehicleApi = axios.create({
  baseURL: VEHICLE_API_BASE || API_BASE,
  timeout: 65000,
})

export async function runVehicleLookup(plate) {
  const target = plate.trim().toUpperCase()

  if (VEHICLE_API_BASE) {
    // Expected response from the dedicated Render wrapper:
    // { success: true, rc: "GJ01AB1234", output: "...full stdout..." }
    return vehicleApi.post('/vehicle', { rc: target })
  }

  // Local/current OSINT-X backend fallback.
  return api.get('/api/vehicle/' + encodeURIComponent(target))
}

export function friendlyError(err) {
  if (axios.isCancel(err)) return 'Request cancelled.'
  if (err.code === 'ECONNABORTED') return 'Timed out waiting for the vehicle command to finish.'
  if (err.message === 'Network Error') {
    const target = VEHICLE_API_BASE || API_BASE
    return 'Cannot reach the backend at ' + target + '. Check that the backend service is running.'
  }
  if (err.response?.data?.detail) {
    return typeof err.response.data.detail === 'string'
      ? err.response.data.detail
      : 'The backend rejected this request.'
  }
  if (err.response) {
    return 'Server error (' + err.response.status + '). Check the target and try again.'
  }
  return 'Something went wrong. Check the target and try again.'
}
