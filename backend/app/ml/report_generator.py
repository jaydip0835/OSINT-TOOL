"""
Automated Intelligence Report Generator
-----------------------------------------
Takes the raw JSON already returned by the domain/ip/vehicle/username/
metadata endpoints and produces:
  1. A template-based natural-language narrative summary (extractive NLG —
     picks out the highest-signal facts and renders them as sentences,
     the same approach used in report-templating literature for security
     operations centers, avoiding the need for a heavyweight LLM call).
  2. An overall composite risk rating across all investigated modules.
  3. Nodes/edges for an entity-relationship graph (domain/IP/vehicle/breach/
     username as nodes, discovered relationships as edges) for the frontend
     graph view.
"""
from datetime import datetime, timezone


def _sentence_for_domain(domain_block: dict) -> list:
    sentences = []
    if not domain_block:
        return sentences
    data = domain_block.get("data", {})
    d = domain_block.get("domain", "the domain")
    whois = data.get("whois", {})
    risk = data.get("risk_assessment", {})

    if whois and "error" not in whois:
        sentences.append(
            f"Domain '{d}' is registered with '{whois.get('registrar')}' "
            f"and was created on {whois.get('creation_date')}."
        )
    if risk and "error" not in risk:
        sentences.append(
            f"The ML risk engine rates '{d}' as {risk.get('risk_label', 'Unknown')} "
            f"(score {risk.get('risk_score', '?')}/100), citing: "
            f"{', '.join(risk.get('contributing_factors', []))}."
        )
    return sentences


def _sentence_for_ip(ip_block: dict) -> list:
    sentences = []
    if not ip_block:
        return sentences
    data = ip_block.get("data", {})
    ip = ip_block.get("ip", "the IP address")
    geo = data.get("geolocation", {})
    risk = data.get("risk_assessment", {})

    if isinstance(geo, dict) and geo.get("status") == "success":
        sentences.append(
            f"IP '{ip}' geolocates to {geo.get('city', 'an unknown city')}, "
            f"{geo.get('country', 'an unknown country')}, hosted by {geo.get('isp', 'an unknown ISP')}."
        )
    if risk and "error" not in risk:
        sentences.append(
            f"The IP risk score is {risk.get('risk_score', '?')}/100 ({risk.get('risk_label', 'Unknown')})."
        )
    return sentences


def _sentence_for_vehicle(vehicle_block: dict) -> list:
    sentences = []
    if not vehicle_block:
        return sentences
    data = vehicle_block.get("data", {})
    plate = vehicle_block.get("vehicle", "the plate")

    if data.get("valid_format") and data.get("state_name"):
        sentences.append(
            f"'{plate}' decodes to state '{data.get('state_name')}', RTO region "
            f"'{data.get('rto_name') or 'Unknown'}' (RTO code {data.get('rto_code')})."
        )
    elif data.get("valid_format"):
        sentences.append(f"'{plate}' matches a recognised plate format, but the state/RTO code wasn't in the reference table.")
    else:
        sentences.append(f"'{plate}' doesn't match a recognised Indian plate format.")
    if data.get("maker_model") or data.get("model_name"):
        sentences.append(
            f"Vehicle metadata reports model '{data.get('maker_model') or 'Unknown'}' "
            f"from '{data.get('model_name') or 'Unknown manufacturer'}', fuel type "
            f"'{data.get('fuel_type') or 'Unknown'}'."
        )
    if data.get("synthetic_demo"):
        sentences.append("Owner/contact fields in this result are explicitly synthetic demo data.")
    confidence = data.get("confidence", {})
    if confidence.get("confidence_score") is not None:
        sentences.append(
            f"Decode confidence: {confidence.get('confidence_score')}/100 ({confidence.get('confidence_label', 'Unknown')})."
        )
    return sentences


def _sentence_for_username(username_block: dict) -> list:
    sentences = []
    if not username_block:
        return sentences
    u = username_block.get("username", "the username")
    found_count = username_block.get("found_count", 0)
    conf = username_block.get("identity_confidence", {})

    sentences.append(f"Username '{u}' was found active on {found_count} platform(s).")
    if conf:
        sentences.append(
            f"Identity correlation confidence: {conf.get('confidence_score', '?')}/100 "
            f"({conf.get('confidence_label', 'Unknown')})."
        )
    return sentences


def _overall_risk(risk_scores: list) -> dict:
    if not risk_scores:
        return {"composite_score": 0, "label": "Insufficient Data"}
    composite = int(round(sum(risk_scores) / len(risk_scores)))
    if composite >= 70:
        label = "High Risk"
    elif composite >= 40:
        label = "Medium Risk"
    else:
        label = "Low Risk"
    return {"composite_score": composite, "label": label}


def generate_report(payload: dict) -> dict:
    """payload keys (all optional): domain, ip, vehicle, username, metadata
    — each is the raw JSON already returned by that module's endpoint."""
    target = payload.get("target", "Investigation Target")

    narrative = [f"OSINT-X Investigation Report for: {target}",
                 f"Generated: {datetime.now(timezone.utc).isoformat()}", ""]

    risk_scores = []
    nodes, edges = [], []
    node_ids = set()

    def add_node(node_id, label, node_type):
        if node_id not in node_ids:
            nodes.append({"id": node_id, "label": label, "type": node_type})
            node_ids.add(node_id)

    domain_block = payload.get("domain")
    if domain_block:
        narrative += _sentence_for_domain(domain_block)
        r = domain_block.get("data", {}).get("risk_assessment", {})
        if "risk_score" in r:
            risk_scores.append(r["risk_score"])
        d_id = f"domain:{domain_block.get('domain')}"
        add_node(d_id, domain_block.get("domain"), "domain")
        add_node("target", target, "target")
        edges.append({"source": "target", "target": d_id, "relation": "resolves_to"})

    ip_block = payload.get("ip")
    if ip_block:
        narrative += _sentence_for_ip(ip_block)
        r = ip_block.get("data", {}).get("risk_assessment", {})
        if "risk_score" in r:
            risk_scores.append(r["risk_score"])
        ip_id = f"ip:{ip_block.get('ip')}"
        add_node(ip_id, ip_block.get("ip"), "ip")
        if domain_block:
            edges.append({"source": f"domain:{domain_block.get('domain')}", "target": ip_id, "relation": "hosted_at"})
        else:
            add_node("target", target, "target")
            edges.append({"source": "target", "target": ip_id, "relation": "resolves_to"})

    vehicle_block = payload.get("vehicle")
    if vehicle_block:
        narrative += _sentence_for_vehicle(vehicle_block)
        c_id = f"vehicle:{vehicle_block.get('vehicle')}"
        add_node(c_id, vehicle_block.get("vehicle"), "vehicle")
        add_node("target", target, "target")
        edges.append({"source": "target", "target": c_id, "relation": "linked_to"})

    username_block = payload.get("username")
    if username_block:
        narrative += _sentence_for_username(username_block)
        u_id = f"username:{username_block.get('username')}"
        add_node(u_id, username_block.get("username"), "username")
        add_node("target", target, "target")
        edges.append({"source": "target", "target": u_id, "relation": "linked_to"})
        for f in username_block.get("found", []):
            plat_id = f"platform:{f.get('platform')}"
            add_node(plat_id, f.get("platform"), "platform")
            edges.append({"source": u_id, "target": plat_id, "relation": "active_on"})

    if not any([domain_block, ip_block, vehicle_block, username_block]):
        narrative.append("No module data was supplied to the report generator.")

    overall = _overall_risk(risk_scores)
    narrative.append("")
    narrative.append(
        f"Overall composite risk assessment: {overall['label']} ({overall['composite_score']}/100), "
        f"based on {len(risk_scores)} scored module(s)."
    )

    return {
        "target": target,
        "narrative_summary": "\n".join(narrative),
        "overall_risk": overall,
        "graph": {"nodes": nodes, "edges": edges},
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
