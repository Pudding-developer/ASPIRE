const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = rawBase.replace(/\/+$/, '');

export const authApi = {
  async register(data) {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || 'Registration failed');
    }

    return response.json();
  },

  async login(data) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || 'Login failed');
    }

    return response.json();
  }
};
