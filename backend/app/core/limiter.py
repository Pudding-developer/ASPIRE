"""
limiter.py — Shared slowapi Limiter instance for application-wide HTTP rate limiting.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[],  # Individual endpoints will define custom limits
)
