"""
test_pseudonymizer.py — Unit tests for pseudonymizer boundary protection.
"""
from app.core.pseudonymizer import redact_pii, _collect_pii_strings

def test_redact_pii_ignores_technical_terms():
    """Verify that common tech words like 'git' and 'github' are not redacted even if in name/email."""
    original_data = {
        "full_name": "GIT DEMO",
        "email": "git1@gmail.com",
        "sr_code": "22-20000",
        "github": {
            "username": "Pudding-developer",
            "repositories": [
                {"full_name": "Pudding-developer/gadget_manager"}
            ]
        }
    }

    # Verify collect_pii_strings does not collect "git" or "demo" or "github" individually
    needles = _collect_pii_strings(original_data)
    assert "git" not in [n.lower() for n in needles]
    assert "demo" not in [n.lower() for n in needles]
    assert "github" not in [n.lower() for n in needles]
    
    # But does collect the full name and email
    assert "GIT DEMO" in needles
    assert "git1@gmail.com" in needles

    # Verify redact_pii behavior
    sample_text = '{"skill": "Git", "github_score": 85, "summary": "Git is a version control system used by GIT DEMO."}'
    redacted = redact_pii(sample_text, original_data)
    
    # "Git" and "github_score" should remain intact
    assert "Git" in redacted
    assert "github_score" in redacted
    # The actual user name should be redacted
    assert "GIT DEMO" not in redacted
    assert "[REDACTED]" in redacted
