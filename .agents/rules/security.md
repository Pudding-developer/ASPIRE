---
trigger: manual
---

"When writing authentication logic, strictly enforce school-specific G Suite domains. Always check for the hd (Hosted Domain) claim in Google OAuth ID tokens and verify it against our institution's domain. Raise a 403 Forbidden error if the domain does not match."