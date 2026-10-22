"""
ML Risk & Threat Scoring Engine
--------------------------------
Trains lightweight RandomForest classifiers on labeled synthetic feature
data (built from the same structural heuristics reported in phishing /
domain-reputation literature: domain age, risky TLDs, suspicious keywords,
disposable-email domains, hosting-provider IPs, etc.).

Why synthetic-but-heuristic-labeled data: a full labeled real-world phishing
dataset (PhishTank / OpenPhish / Kaggle) can be swapped in later by loading
a CSV into `train_domain_model()` — the pipeline (feature vector -> model ->
risk score) does not change. This keeps the engine runnable fully offline
for development/demo while still being a real, trained ML model rather than
a hardcoded if/else score.
"""
import random
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier

MODELS_DIR = Path(__file__).parent / "trained_models"
MODELS_DIR.mkdir(exist_ok=True)

DOMAIN_FEATURES = [
    "domain_length", "hyphen_count", "digit_count", "risky_tld",
    "suspicious_keyword_count", "domain_age_days", "age_unknown",
    "dns_record_count", "has_mx",
]
IP_FEATURES = ["is_hosting_provider", "has_reverse_dns", "has_geolocation"]

_rng = random.Random(42)


def _sample_domain_row():
    age_unknown = 1 if _rng.random() < 0.15 else 0
    age = -1 if age_unknown else _rng.choice(
        [_rng.randint(0, 30), _rng.randint(31, 365), _rng.randint(366, 5000)]
    )
    row = {
        "domain_length": _rng.randint(4, 40),
        "hyphen_count": _rng.choice([0, 0, 0, 1, 2, 3]),
        "digit_count": _rng.choice([0, 0, 0, 1, 2, 4]),
        "risky_tld": 1 if _rng.random() < 0.2 else 0,
        "suspicious_keyword_count": _rng.choice([0, 0, 0, 1, 2, 3]),
        "domain_age_days": age,
        "age_unknown": age_unknown,
        "dns_record_count": _rng.randint(0, 12),
        "has_mx": _rng.choice([0, 1]),
    }
    score = 0
    score += 2 if row["risky_tld"] else 0
    score += row["suspicious_keyword_count"]
    score += 1 if row["hyphen_count"] >= 2 else 0
    score += 1 if row["digit_count"] >= 2 else 0
    score += 2 if (0 <= row["domain_age_days"] < 60) else 0
    score += 1 if row["age_unknown"] else 0
    score += 1 if row["dns_record_count"] <= 1 else 0
    score -= 1 if row["domain_age_days"] > 1000 else 0
    label = 1 if score + _rng.gauss(0, 1.0) >= 4 else 0
    return row, label


def _sample_ip_row():
    row = {
        "is_hosting_provider": _rng.choice([0, 0, 1]),
        "has_reverse_dns": _rng.choice([0, 1]),
        "has_geolocation": _rng.choice([0, 1, 1]),
    }
    score = 0
    score += 2 if row["is_hosting_provider"] else 0
    score += 1 if not row["has_reverse_dns"] else 0
    score += 1 if not row["has_geolocation"] else 0
    label = 1 if score + _rng.gauss(0, 0.8) >= 2.5 else 0
    return row, label


def _train(feature_names, sampler, n=4000):
    X, y = [], []
    for _ in range(n):
        row, label = sampler()
        X.append([row[f] for f in feature_names])
        y.append(label)
    clf = RandomForestClassifier(n_estimators=120, max_depth=6, random_state=42)
    clf.fit(np.array(X), np.array(y))
    return clf


def _load_or_train(name, feature_names, sampler):
    path = MODELS_DIR / f"{name}.joblib"
    if path.exists():
        return joblib.load(path)
    clf = _train(feature_names, sampler)
    joblib.dump(clf, path)
    return clf


_domain_clf = _load_or_train("domain_risk", DOMAIN_FEATURES, _sample_domain_row)
_ip_clf = _load_or_train("ip_risk", IP_FEATURES, _sample_ip_row)


def _label_for(score: int) -> str:
    if score >= 70:
        return "High Risk"
    if score >= 40:
        return "Medium Risk"
    return "Low Risk"


# Human-readable explanation shown only when the condition actually
# indicates elevated risk (avoids surfacing a continuous field like
# "domain age" just because it's non-zero).
_FACTOR_CONDITIONS = {
    "risky_tld": (lambda v: v == 1, "registered under a high-abuse TLD"),
    "suspicious_keyword_count": (lambda v: v >= 1, "suspicious keywords in name (e.g. login/verify/secure)"),
    "hyphen_count": (lambda v: v >= 2, "unusually many hyphens"),
    "digit_count": (lambda v: v >= 3, "unusually many digits"),
    "domain_age_days": (lambda v: 0 <= v < 60, "very recently registered domain"),
    "age_unknown": (lambda v: v == 1, "registration age could not be verified"),
    "dns_record_count": (lambda v: v <= 1, "very few DNS records configured"),
    "has_mx": (lambda v: v == 0, "no mail server configured"),
    "is_hosting_provider": (lambda v: v == 1, "IP belongs to a hosting/VPS/cloud provider, not a residential ISP"),
    "has_reverse_dns": (lambda v: v == 0, "no reverse DNS record"),
    "has_geolocation": (lambda v: v == 0, "geolocation lookup failed"),
}


def _top_factors(feature_names, importances, feature_values, top_n=3):
    pairs = sorted(zip(feature_names, importances), key=lambda p: p[1], reverse=True)
    factors = []
    for name, _ in pairs:
        if name not in _FACTOR_CONDITIONS:
            continue
        condition, explanation = _FACTOR_CONDITIONS[name]
        val = feature_values.get(name, 0)
        if condition(val):
            factors.append(explanation)
        if len(factors) >= top_n:
            break
    return factors or ["no strong risk signals detected"]


def _score_with(clf, feature_names, features: dict) -> dict:
    vec = np.array([[features.get(f, 0) for f in feature_names]])
    proba = clf.predict_proba(vec)[0]
    risk_proba = proba[1] if len(proba) > 1 else proba[0]
    score = int(round(risk_proba * 100))
    return {
        "risk_score": score,
        "risk_label": _label_for(score),
        "contributing_factors": _top_factors(feature_names, clf.feature_importances_, features),
        "model": "RandomForestClassifier",
    }


def get_domain_risk(features: dict) -> dict:
    return _score_with(_domain_clf, DOMAIN_FEATURES, features)


def get_ip_risk(features: dict) -> dict:
    return _score_with(_ip_clf, IP_FEATURES, features)
