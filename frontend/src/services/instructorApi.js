const BASE = '/api/instructor';

// Helper: always send Authorization header with JWT from localStorage
function authHeaders() {
  const token = localStorage.getItem('aspire_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  // 204 No Content has no body — return null instead of crashing
  if (res.status === 204) return null;
  return res.json();
}

export const instructorApi = {
  getDashboardStats: ()              => request('GET',    '/dashboard'),
  getClasses:        ()              => request('GET',    '/classes'),
  getArchivedClasses:()              => request('GET',    '/classes/archived'),
  createClass:       (data)          => request('POST',   '/classes', data),
  archiveClass:      (id)            => request('PATCH',  `/classes/${id}/archive`),
  deleteClass:       (id)            => request('DELETE', `/classes/${id}`),
};
