import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { refreshSession, logoutSession, loginWithGoogle } from '../services/api';

const AuthContext = createContext(null);
const REFRESH_TOKEN_STORAGE_KEY = 'myciti_refresh_token';

export function AuthProvider({ children }) {
  // In-memory access token
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore session on mount via /api/auth/refresh (supports Cookie and LocalStorage fallback)
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
        const data = await refreshSession(storedRefreshToken);
        if (isMounted) {
          setAccessToken(data.accessToken);
          setUser(data.user);
          if (data.refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
          }
          setAuthError(null);
        }
      } catch (err) {
        // No active or valid token; clear storage
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
        if (isMounted) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Proactive session refresh (e.g., on 401 or timer)
  const refreshCurrentToken = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      const data = await refreshSession(storedRefreshToken);
      setAccessToken(data.accessToken);
      setUser(data.user);
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
      }
      return data.accessToken;
    } catch (err) {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      setAccessToken(null);
      setUser(null);
      throw err;
    }
  }, []);

  // Proactive background refresh every 12 minutes (token lifetime is 15 minutes)
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      refreshCurrentToken().catch(() => {});
    }, 12 * 60 * 1000);
    return () => clearInterval(interval);
  }, [accessToken, refreshCurrentToken]);

  // Handle Google sign in
  const handleGoogleLogin = useCallback(async (idToken) => {
    try {
      setAuthError(null);
      const data = await loginWithGoogle(idToken);
      setAccessToken(data.accessToken);
      setUser(data.user);
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
      }
      return data;
    } catch (err) {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      if (err.status === 403) {
        setAuthError('Your account is suspended. Contact admin@myciti.com');
      } else {
        setAuthError(err.message || 'Google sign-in failed. Please try again.');
      }
      throw err;
    }
  }, []);

  // Update in-memory user profile
  const updateUserProfile = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      await logoutSession(storedRefreshToken);
    } catch (e) {
      console.warn('Logout request warning:', e);
    } finally {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isInitializing,
        authError,
        setAuthError,
        handleGoogleLogin,
        handleLogout,
        refreshCurrentToken,
        updateUserProfile,
        isAuthenticated: !!accessToken && !!user,
        isAdmin: user?.role === 'ADMIN',
        isProfileComplete: !!user?.profileComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
