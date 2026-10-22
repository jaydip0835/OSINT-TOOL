"""
Feature extraction for the ML Risk & Threat Scoring Engine.

These features are inspired by structural URL/domain feature sets used in
lightweight phishing-detection literature (e.g. URL length, subdomain count,
suspicious keywords, domain age, special characters) rather than requiring
heavy content scraping or third-party paid threat-intel APIs.
"""
import re
from datetime import datetime, timezone
from dateutil import parser as dateutil_parser

SUSPICIOUS_KEYWORDS = [
    "login", "verify", "secure", "account", "update", "confirm",
    "bank", "signin", "password", "wallet", "support", "billing",
    "invoice", "gift", "free", "bonus", "click", "urgent",
]

RISKY_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "xyz", "top", "work", "click",
    "loan", "win", "review", "party", "gdn", "kim",
}

def _domain_age_days(creation_date) -> float:
    """Return domain age in days from a whois creation_date value (handles
    strings, datetimes, and lists returned by python-whois)."""
    try:
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
        if isinstance(creation_date, str):
            if creation_date.lower() in ("none", ""):
                return -1.0
            creation_date = dateutil_parser.parse(creation_date)
        if creation_date is None:
            return -1.0
        if creation_date.tzinfo is None:
            creation_date = creation_date.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - creation_date
        return float(delta.days)
    except Exception:
        return -1.0


def extract_domain_features(domain: str, whois_data: dict, dns_data: dict) -> dict:
    tld = domain.rsplit(".", 1)[-1].lower() if "." in domain else ""
    hyphens = domain.count("-")
    digits = sum(c.isdigit() for c in domain)
    keyword_hits = sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in domain.lower())

    creation_date = None
    if isinstance(whois_data, dict) and "error" not in whois_data:
        creation_date = whois_data.get("creation_date")
    age_days = _domain_age_days(creation_date)

    dns_record_count = 0
    if isinstance(dns_data, dict) and "error" not in dns_data:
        dns_record_count = sum(len(v) for v in dns_data.values() if isinstance(v, list))

    return {
        "domain_length": len(domain),
        "hyphen_count": hyphens,
        "digit_count": digits,
        "risky_tld": 1 if tld in RISKY_TLDS else 0,
        "suspicious_keyword_count": keyword_hits,
        "domain_age_days": age_days,
        "age_unknown": 1 if age_days < 0 else 0,
        "dns_record_count": dns_record_count,
        "has_mx": 1 if (isinstance(dns_data, dict) and dns_data.get("MX")) else 0,
    }


def extract_ip_features(geolocation: dict, reverse_dns) -> dict:
    org = ""
    if isinstance(geolocation, dict):
        org = f"{geolocation.get('isp', '')} {geolocation.get('org', '')}".lower()

    hosting_flag = 1 if any(k in org for k in ["hosting", "vps", "cloud", "server", "colo"]) else 0
    has_rdns = 1 if isinstance(reverse_dns, str) and reverse_dns else 0
    has_geo = 1 if isinstance(geolocation, dict) and geolocation.get("status") == "success" else 0

    return {
        "is_hosting_provider": hosting_flag,
        "has_reverse_dns": has_rdns,
        "has_geolocation": has_geo,
    }
