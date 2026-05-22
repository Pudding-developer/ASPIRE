"""
pseudonymizer.py — Boundary pseudonymization for the AI pipeline.

Single chokepoint for transforming student PII into stable, keyed pseudonyms
before any identifier crosses into Vertex/Gemini, GitHub API tool inputs, or
LLM-bound logs. Output-side `redact_pii` scrubs cleartext PII that may have
leaked back in LLM completions (prompt injection, memorization, hallucination).

Threat model: AI breach surfaces — provider prompt retention, model
memorization leakage, prompt-injection exfiltration, compromised AI creds.
DB and UI continue to use cleartext; this layer only guards the AI boundary.
"""
from __future__ import annotations

import copy
import hmac
import hashlib
import logging
import re
from typing import Any

from app.core.config import PSEUDONYM_KEY

logger = logging.getLogger(__name__)

_PSEUDO_LEN = 12  # hex chars kept from the HMAC digest


def pseudonymize(value: str, namespace: str) -> str:
    """Keyed HMAC-SHA256 truncated to 12 hex chars.

    `namespace` ("sr_code", "email", "github_user", ...) means the same raw
    string yields *different* pseudonyms across contexts, so an attacker who
    sees both cannot correlate them.
    """
    if not value:
        return "unknown"
    msg = f"{namespace}:{value}".encode("utf-8")
    digest = hmac.new(PSEUDONYM_KEY.encode("utf-8"), msg, hashlib.sha256).hexdigest()
    return digest[:_PSEUDO_LEN]


def pseudonymize_student_data(data: dict) -> dict:
    """Deep-copy of `data` with every LLM-bound identifier replaced.

    Fields covered: sr_code, full_name, email, github.username,
    github.repositories[*].full_name (owner segment), session token in place
    of any human-readable name. Idempotent: calling twice yields the same
    output because HMAC is deterministic over (key, namespace, value).
    """
    if not isinstance(data, dict):
        return data
    out = copy.deepcopy(data)

    if out.get("sr_code"):
        out["sr_code"] = pseudonymize(out["sr_code"], "sr_code")
    if out.get("full_name"):
        out["full_name"] = f"Student-{pseudonymize(out['full_name'], 'name')[:8]}"
    if out.get("email"):
        out["email"] = f"{pseudonymize(out['email'], 'email')}@redacted.invalid"

    gh = out.get("github")
    if isinstance(gh, dict):
        username = gh.get("username")
        gh_pseudo = pseudonymize(username, "github_user") if username else None
        if username:
            gh["username"] = gh_pseudo
        if gh.get("bio"):
            # Bio is free-text; strip rather than pseudonymize.
            gh["bio"] = "[REDACTED]"
        for repo in gh.get("repositories", []) or []:
            if not isinstance(repo, dict):
                continue
            full = repo.get("full_name") or ""
            if "/" in full and username:
                _, _, repo_name = full.partition("/")
                repo["full_name"] = f"{gh_pseudo}/{repo_name}"
    return out


# ----- Output-side redaction ---------------------------------------------

# Generic patterns — catch PII shapes even if not in the known set.
_EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", re.IGNORECASE)
_SR_CODE_RE = re.compile(r"\b\d{2}-\d{4,6}\b")  # e.g. 21-12345

_MIN_REDACT_LEN = 3


def _collect_pii_strings(original: dict) -> list[str]:
    """Pull every PII string out of the *original* (cleartext) student_data.

    Includes full_name tokens (first/last alone) since an LLM may echo just
    one. Returned longest-first so substring replacement doesn't break on
    "Anggelo" appearing inside "Anggelo Lopez".
    """
    pii: set[str] = set()

    def _add(s: Any) -> None:
        if isinstance(s, str) and len(s) >= _MIN_REDACT_LEN:
            pii.add(s.strip())

    _add(original.get("sr_code"))
    _add(original.get("email"))
    name = original.get("full_name") or ""
    _add(name)
    for tok in name.split():
        _add(tok)

    gh = original.get("github") or {}
    if isinstance(gh, dict):
        _add(gh.get("username"))
        for repo in gh.get("repositories", []) or []:
            if isinstance(repo, dict):
                # owner segment of full_name == username; covered above
                _add(repo.get("full_name"))

    return sorted(pii, key=len, reverse=True)


def redact_pii(text: str, original: dict) -> str:
    """Replace any cleartext PII from `original` that appears in `text`.

    Defense-in-depth: the LLM shouldn't have seen these strings in the first
    place, but prompt-injection or memorization can echo PII back. Also
    catches generic email / sr_code shapes the LLM may invent.
    """
    if not text:
        return text
    redacted = text
    for needle in _collect_pii_strings(original):
        if not needle:
            continue
        redacted = re.sub(re.escape(needle), "[REDACTED]", redacted, flags=re.IGNORECASE)
    redacted = _EMAIL_RE.sub("[REDACTED_EMAIL]", redacted)
    redacted = _SR_CODE_RE.sub("[REDACTED_SR]", redacted)
    return redacted
