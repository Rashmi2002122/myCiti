import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { refreshSession, logoutSession, loginWithGoogle, updateMyCoarseLocation } from '../services/api';

const AuthContext = createContext(null);

const USER_STORAGE_KEY = 'myciti_user';
const ACCESS_TOKEN_STORAGE_KEY = 'myciti_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'myciti_refresh_token';

// Singleton in-flight promise to avoid multiple simultaneous refresh requests
let inFlightRefresh = null;

async function executeRefresh(token) {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }
  inFlightRefresh = refreshSession(token).finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

function persistSession(data) {
  if (data?.accessToken) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.accessToken);
  }
  if (data?.user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  }
  // SEC-02: Do NOT write raw refresh tokens to localStorage. The backend sets an HttpOnly cookie.
  // Purge any legacy token from prior versions.
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function clearSessionStorage() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }) {
  // Synchronously restore user and accessToken from localStorage so refresh never flickers logged-out
  const [accessToken, setAccessToken] = useState(() => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore and validate session in background on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const legacyRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

      // If user is not logged in at all, skip network call
      if (!storedAccessToken && !storedUser && !legacyRefreshToken) {
        if (isMounted) setIsInitializing(false);
        return;
      }

      try {
        const data = await executeRefresh(legacyRefreshToken || null);
        if (isMounted) {
          setAccessToken(data.accessToken);
          setUser(data.user);
          persistSession(data);
          setAuthError(null);
        }
      } catch (err) {
        console.warn('[Auth] Session validation/refresh warning:', err);
        // Only clear storage if backend explicitly rejected credentials (401 or 403)
        // If it's a network glitch or Render free-tier cold-start (502/503/504), KEEP cached user
        if (err.status === 401 || err.status === 403) {
          clearSessionStorage();
          if (isMounted) {
            setAccessToken(null);
            setUser(null);
          }
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

  // Proactive session refresh (e.g. on 401 or timer)
  const refreshCurrentToken = useCallback(async () => {
    try {
      const legacyRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      const data = await executeRefresh(legacyRefreshToken || null);
      setAccessToken(data.accessToken);
      setUser(data.user);
      persistSession(data);
      return data.accessToken;
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearSessionStorage();
        setAccessToken(null);
        setUser(null);
      }
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
      persistSession(data);
      return data;
    } catch (err) {
      clearSessionStorage();
      if (err.status === 403) {
        setAuthError('Your account is suspended. Contact admin@myciti.com');
      } else {
        setAuthError(err.message || 'Google sign-in failed. Please try again.');
      }
      throw err;
    }
  }, []);

  // Update in-memory and stored user profile
  const updateUserProfile = useCallback((updatedUser) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  }, []);

  // Sync location to backend
  const syncLocation = useCallback(async (locationData) => {
    if (!accessToken) return null;
    try {
      const updatedUser = await updateMyCoarseLocation(accessToken, locationData);
      setUser(updatedUser);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.warn('Failed to sync location to backend:', err);
      return null;
    }
  }, [accessToken]);

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      await logoutSession(storedRefreshToken);
    } catch (e) {
      console.warn('Logout request warning:', e);
    } finally {
      clearSessionStorage();
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
        syncLocation,
        isAuthenticated: !!accessToken && !!user,
        isAdmin: user?.role === 'ADMIN',
        isClient: user?.role === 'CLIENT' || user?.role === 'SUBMITTER' || user?.role === 'ADMIN',
        isConsumer: user?.role === 'USER',
        canPost: user?.role === 'CLIENT' || user?.role === 'SUBMITTER' || user?.role === 'ADMIN',
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
