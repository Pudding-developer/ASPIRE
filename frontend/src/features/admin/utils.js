export const API_BASE = 'http://localhost:8000';

export function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
