# OSINT-X Vehicle CMD Integration

The existing route `GET /api/vehicle/{plate}` now runs the bundled fixed Python command and returns captured stdout plus structured vehicle fields.

## Render
- Root Directory: `backend`
- Build Command: `pip install -r requirements.txt`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Health Check: `/health`

### Fake owner/contact/address demo
Add Render environment variable `VEHICLE_DEMO_MODE=1`. In this mode the backend uses `app/tools/demo_vehicle_data.json` and does not call the external vehicle API. Edit that JSON to change the synthetic values.

Without demo mode, live personal keys Owner Name, Phone and Address are filtered.

## Frontend `.env`
```env
VITE_API_BASE_URL=https://osint-x-platform.onrender.com
VITE_VEHICLE_API_BASE_URL=
```
Restart with `npm run dev`.

Flow: Website -> `/api/vehicle/GJ01NX4800` -> plate decoder + `vehicle_lookup.py --rc=...` -> full captured CMD output + structured cards -> Export PDF.
