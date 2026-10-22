import asyncio
import socket

import dns.resolver
import httpx
import whois
from fastapi import APIRouter

from app.ml.feature_extraction import extract_domain_features
from app.ml.risk_model import get_domain_risk

router = APIRouter(prefix="/api/domain", tags=["Domain Investigation"])


def _whois_lookup(domain: str) -> dict:
    w = whois.whois(domain, timeout=8)
    return {
        "registrar": str(w.registrar),
        "creation_date": str(w.creation_date),
        "expiration_date": str(w.expiration_date),
        "name_servers": w.name_servers,
        "status": str(w.status),
        "country": str(w.country),
    }


def _dns_lookup(domain: str) -> dict:
    resolver = dns.resolver.Resolver()
    resolver.timeout = 4
    resolver.lifetime = 4
    dns_records = {}
    for record_type in ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "CAA", "SOA"]:
        try:
            answers = resolver.resolve(domain, record_type)
            dns_records[record_type] = [str(r) for r in answers]
        except Exception:
            dns_records[record_type] = []
    return dns_records


def _resolve_ip(domain: str) -> str:
    socket.setdefaulttimeout(5)
    return socket.gethostbyname(domain)


@router.get("/{domain}")
async def investigate_domain(domain: str):
    result = {}

    # 1. WHOIS Lookup (blocking library -> run in a thread with a hard timeout
    # so a slow/unresponsive whois server can't freeze the whole request)
    try:
        result["whois"] = await asyncio.wait_for(
            asyncio.to_thread(_whois_lookup, domain), timeout=10
        )
    except asyncio.TimeoutError:
        result["whois"] = {"error": "WHOIS lookup timed out"}
    except Exception as e:
        result["whois"] = {"error": str(e)}

    # 2. DNS Records
    try:
        result["dns"] = await asyncio.wait_for(
            asyncio.to_thread(_dns_lookup, domain), timeout=8
        )
    except asyncio.TimeoutError:
        result["dns"] = {"error": "DNS lookup timed out"}
    except Exception as e:
        result["dns"] = {"error": str(e)}

    # 3. IP Address
    try:
        result["ip_address"] = await asyncio.wait_for(
            asyncio.to_thread(_resolve_ip, domain), timeout=6
        )
    except asyncio.TimeoutError:
        result["ip_address"] = {"error": "Resolution timed out"}
    except Exception as e:
        result["ip_address"] = {"error": str(e)}

    # 4. HTTP Headers
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
            response = await client.get(f"https://{domain}")
            headers = dict(response.headers)
            result["http_headers"] = headers
            result["status_code"] = response.status_code
            # Report only observed security-related headers; do not infer missing values.
            security_header_names = [
                "strict-transport-security", "content-security-policy",
                "x-content-type-options", "x-frame-options",
                "referrer-policy", "permissions-policy", "cross-origin-opener-policy",
            ]
            result["security_headers"] = {
                name: headers[name] for name in security_header_names if name in headers
            }
            result["missing_security_headers"] = [
                name for name in security_header_names if name not in headers
            ]
    except Exception as e:
        result["http_headers"] = {"error": str(e)}

    # 5. ML Risk & Threat Score
    try:
        features = extract_domain_features(domain, result.get("whois", {}), result.get("dns", {}))
        result["risk_assessment"] = get_domain_risk(features)
    except Exception as e:
        result["risk_assessment"] = {"error": str(e)}

    return {
        "domain": domain,
        "data": result
    }
