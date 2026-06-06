/**
 * useAuth — Manages JWT storage and provides auth state to the app.
 * 
 * Usage:
 *   const { user, token, login, logout, isAuthenticated } = useAuth();
 */
import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const TOKEN_KEY = 'aspire_token';
const USER_KEY = 'aspire_user';

/**
 * Decode a JWT payload (without verification — that's the backend's job).
 */
function decodeJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((jwtToken) => {
    const payload = decodeJwtPayload(jwtToken);
    if (!payload) return;

    const userData = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      full_name: payload.full_name,
      avatar_url: payload.avatar_url,
    };

    localStorage.setItem(TOKEN_KEY, jwtToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(jwtToken);
    setUser(userData);
  }, []);

  const localRegister = useCallback(async (data) => {
    const response = await authApi.register(data);
    login(response.access_token);
    return response.redirect;
  }, [login]);

  const localLogin = useCallback(async (data) => {
    const response = await authApi.login(data);
    login(response.access_token);
    return response.redirect;
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token;

  // Check if mathematical JWT token is expired
  useEffect(() => {
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload && payload.exp && Date.now() / 1000 > payload.exp) {
        logout();
      }
    }
  }, [token, logout]);

  // Inactivity (Idle) Timeout: Log out after 20 minutes of no user interaction
  useEffect(() => {
    if (!token) return;

    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        window.location.href = '/'; // Force back to login screen
      }, 20 * 60 * 1000); // 20 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer(); // Start timer immediately upon hook mount

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [token, logout]);

  return { user, token, login, logout, isAuthenticated, localRegister, localLogin };
}
