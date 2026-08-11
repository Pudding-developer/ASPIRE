"""
test_rate_limit.py — Unit test verifying HTTP rate limiting on FastAPI endpoints via slowapi.
"""
import pytest
from app.core.limiter import limiter


@pytest.mark.asyncio
async def test_rate_limit_exceeded(client):
    """Verify that calling /auth/login repeatedly triggers 429 Too Many Requests."""
    # Reset limiter storage before test
    limiter.reset()

    # Rate limit on /auth/login is 10/minute
    responses = []
    for _ in range(12):
        res = await client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"}
        )
        responses.append(res.status_code)

    # First 10 requests should process (e.g. 401 or 404 unauthorized/invalid)
    assert all(code in (401, 404, 200) for code in responses[:10])
    
    # 11th and 12th requests should be blocked by slowapi with 429
    assert responses[10] == 429
    assert responses[11] == 429
