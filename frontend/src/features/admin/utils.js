export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
