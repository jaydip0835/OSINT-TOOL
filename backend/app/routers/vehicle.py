import time
from fastapi import APIRouter
from app.modules import vehicle_service as svc

router = APIRouter(prefix="/api/vehicle", tags=["Vehicle Intelligence Console"])

@router.get("/{plate}")
def investigate_vehicle(plate: str):
    start = time.monotonic()
    target = plate.upper().replace(" ", "").strip()
    parsed = svc.parse_plate(target)
    confidence = svc.build_confidence(parsed)
    external = svc.run_external_vehicle_lookup(target)

    sources = svc.build_sources()
    sources.append({
        "source_name": "Bundled vehicle_lookup.py backend command",
        "source_category": "vehicle_command",
        "status": "success" if external.get("success") else "failed",
        "timestamp": None,
        "data_returned": bool(external.get("data")),
        "confidence": "source-returned",
    })

    data = {
        "valid_format": parsed.get("valid_format", False),
        "scheme": parsed.get("scheme"),
        "state_code": parsed.get("state_code"),
        "state_name": parsed.get("state_name"),
        "rto_code": parsed.get("rto_code"),
        "rto_name": parsed.get("rto_name"),
        "series": parsed.get("series"),
        "number": parsed.get("number"),
        "registration_year_hint": parsed.get("registration_year_hint"),
        "verification_shortcuts": svc.build_shortcuts(target),
        "sources": sources,
        "confidence": confidence,
        "success": external.get("success", False),
        "output": external.get("output", ""),
        "command_error": external.get("error"),
    }
    data.update(external.get("data") or {})
    data["scan_metadata"] = svc.new_scan_metadata(target, start, sources)
    return {"vehicle": target, "data": data}
