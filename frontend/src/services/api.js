/**
 * api.js — Shared fetch helper with JWT auth for all API calls.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'aspire_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Generic fetch wrapper. Throws on non-OK responses with server error detail.
 * Pass `{ signal }` in `options` to make a request abortable via AbortController.
 */
async function request(method, path, body, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  const refreshed = res.headers.get('X-Refresh-Token');
  if (refreshed) {
    localStorage.setItem(TOKEN_KEY, refreshed);
  }

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('aspire_user');
    window.location.href = '/';
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export { API_BASE, getToken, authHeaders, request };
