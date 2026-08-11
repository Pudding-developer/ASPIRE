const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const API_BASE = rawBase.replace(/\/+$/, '');

export function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}
