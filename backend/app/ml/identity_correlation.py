"""
Cross-Platform Identity Correlation
------------------------------------
Estimates how confidently a username found on multiple platforms belongs to
the *same* real-world individual, rather than just reporting raw
exists/not-exists per platform.

Two signals drive the confidence score, consistent with identity-resolution
literature: (1) breadth — how many independent platforms return a hit, and
(2) uniqueness — how likely it is that this exact handle was independently
chosen by unrelated people (a generic handle like "john" or "admin" matching
on 5 platforms is weak evidence; a high-entropy handle like "xr7_kaelthorne"
matching on 5 platforms is strong evidence).
"""
import math
import re

COMMON_USERNAMES = {
    "admin", "test", "user", "guest", "root", "demo", "info", "support",
    "john", "mike", "alex", "sam", "chris", "david", "james", "robert",
    "official", "contact", "hello", "null", "anonymous", "unknown",
}


def _uniqueness_score(username: str) -> float:
    """Returns 0.0 (very generic) to 1.0 (very unique) based on length,
    character-class diversity, and Shannon entropy of the handle."""
    u = username.lower()

    if u in COMMON_USERNAMES:
        return 0.05
    if u.isdigit():
        return 0.1
    if len(u) <= 3:
        return 0.15

    has_letters = bool(re.search(r"[a-z]", u))
    has_digits = bool(re.search(r"[0-9]", u))
    has_symbols = bool(re.search(r"[_\-.]", u))
    class_diversity = sum([has_letters, has_digits, has_symbols]) / 3.0

    freq = {}
    for ch in u:
        freq[ch] = freq.get(ch, 0) + 1
    entropy = -sum((c / len(u)) * math.log2(c / len(u)) for c in freq.values())
    max_entropy = math.log2(len(set(u))) if len(set(u)) > 1 else 1
    normalized_entropy = entropy / max_entropy if max_entropy else 0

    length_factor = min(len(u) / 14.0, 1.0)

    score = 0.35 * class_diversity + 0.35 * normalized_entropy + 0.3 * length_factor
    return max(0.05, min(1.0, score))


def compute_identity_confidence(username: str, found_platforms: list) -> dict:
    found_count = len(found_platforms)
    uniqueness = _uniqueness_score(username)

    if found_count == 0:
        return {
            "confidence_score": 0,
            "confidence_label": "No Match",
            "uniqueness_score": round(uniqueness, 2),
            "reasoning": "Username was not found on any checked platform.",
        }

    breadth_score = min(found_count / 8.0, 1.0)  # saturates around 8 platforms
    raw = (0.55 * breadth_score + 0.45 * uniqueness) * 100
    score = int(round(raw))

    if score >= 70:
        label = "Likely Same Person"
    elif score >= 40:
        label = "Possibly Same Person"
    else:
        label = "Low Confidence (generic/common handle)"

    if uniqueness < 0.2:
        reasoning = (
            f"Found on {found_count} platform(s), but '{username}' is a common/generic "
            "handle, so matches across platforms are weak evidence of a single identity."
        )
    else:
        reasoning = (
            f"Found on {found_count} platform(s) using a distinctive handle, which is "
            "strong evidence the same individual controls these accounts."
        )

    return {
        "confidence_score": score,
        "confidence_label": label,
        "uniqueness_score": round(uniqueness, 2),
        "reasoning": reasoning,
    }
