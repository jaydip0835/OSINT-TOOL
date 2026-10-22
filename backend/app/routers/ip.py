import asyncio
import ipaddress
import socket
import time

import httpx
from fastapi import APIRouter

from app.ml.feature_extraction import extract_ip_features
from app.ml.risk_model import get_ip_risk

router = APIRouter(prefix="/api/ip", tags=["IP Investigation"])


def _classify_ip(ip: str) -> dict:
    """Local, offline classification — version, scope and reserved ranges."""
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return {"error": "Not a valid IP address"}
    return {
        "version": addr.version,
        "is_private": addr.is_private,
        "is_global": addr.is_global,
        "is_loopback": addr.is_loopback,
        "is_multicast": addr.is_multicast,
        "is_reserved": addr.is_reserved,
        "is_link_local": addr.is_link_local,
    }


def _reverse_dns(ip: str):
    socket.setdefaulttimeout(5)
    return socket.gethostbyaddr(ip)[0]


@router.get("/{ip}")
async def investigate_ip(ip: str):
    result = {}
    t0 = time.monotonic()

    classification = _classify_ip(ip)
    result["classification"] = classification

    # Skip external lookups for non-routable addresses — nothing useful to query
    is_private = classification.get("is_private") or classification.get("is_loopback")

    if is_private:
        result["geolocation"] = {"note": "Private/non-routable address — geolocation skipped"}
    else:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"http://ip-api.com/json/{ip}",
                    params={"fields": "status,message,continent,country,countryCode,region,regionName,"
                                       "city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting,query"},
                )
                data = response.json()
                if data.get("status") == "fail":
                    result["geolocation"] = {"error": data.get("message", "lookup failed")}
                else:
                    result["geolocation"] = data
        except Exception as e:
            result["geolocation"] = {"error": str(e)}

    # Reverse DNS — blocking socket call, run in a thread with a hard timeout
    reverse_dns_value = None
    try:
        reverse_dns_value = await asyncio.wait_for(asyncio.to_thread(_reverse_dns, ip), timeout=6)
        result["reverse_dns"] = reverse_dns_value
    except asyncio.TimeoutError:
        result["reverse_dns"] = {"error": "Reverse DNS lookup timed out"}
    except Exception as e:
        result["reverse_dns"] = {"error": str(e)}

    # ML Risk & Threat Score
    try:
        features = extract_ip_features(result.get("geolocation", {}), reverse_dns_value)
        result["risk_assessment"] = get_ip_risk(features)
    except Exception as e:
        result["risk_assessment"] = {"error": str(e)}

    result["lookup_time_ms"] = round((time.monotonic() - t0) * 1000, 1)

    return {"ip": ip, "data": result}
