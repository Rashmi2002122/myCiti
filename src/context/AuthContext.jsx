import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { refreshSession, logoutSession, loginWithGoogle, updateMyCoarseLocation, getMyProfile } from '../services/api';

const AuthContext = createContext(null);

const USER_STORAGE_KEY = 'mycite_user';
const ACCESS_TOKEN_STORAGE_KEY = 'mycite_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'mycite_refresh_token';

// Singleton in-flight promise to avoid multiple simultaneous refresh requests
let inFlightRefresh = null;

async function executeRefresh(token = null) {
  if (inFlightRefresh) {
    return inFlightRefresh;
  }
  inFlightRefresh = refreshSession(token).finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

function persistSession(data) {
  if (data?.user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  }
  // Enforce security: Access token is kept strictly in memory; refresh token isolated in HttpOnly cookie
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function clearSessionStorage() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem('myciti_user');
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem('myciti_access_token');
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem('myciti_refresh_token');
  try {
    sessionStorage.clear();
  } catch (_) {}

  // Service Worker & CacheStorage hygiene: purge cached authenticated API and user data
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes('api-') || name.includes('notification') || name.includes('user')) {
            caches.delete(name);
          }
        });
      }).catch(() => {});
    } catch (_) {}
  }
}

export function AuthProvider({ children }) {
  // Access token kept in memory only (never written to localStorage)
  const [accessToken, setAccessToken] = useState(null);

  // Synchronously restore user profile for non-flicker UI render on reload
  const [user, setUser] = useState(() => {
    try {
      const stored = (localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem('myciti_user'));
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [roleChangeNotice, setRoleChangeNotice] = useState(null);

  // Check for role change on user change
  useEffect(() => {
    if (user?.role) {
      const knownRole = (localStorage.getItem('mycite_known_role') || localStorage.getItem('myciti_known_role'));
      if (knownRole && knownRole !== user.role) {
        setRoleChangeNotice({
          oldRole: knownRole,
          newRole: user.role
        });
      }
      localStorage.setItem('mycite_known_role', user.role);
    }
  }, [user?.role]);

  const refreshUserProfile = useCallback(async () => {
    let token = accessToken;
    if (!token) {
      try {
        const refreshed = await executeRefresh(null);
        token = refreshed.accessToken;
        setAccessToken(token);
        setUser(refreshed.user);
        persistSession(refreshed);
      } catch {
        return null;
      }
    }
    if (!token) return null;
    try {
      const profile = await getMyProfile(token);
      setUser(profile);
      if (profile) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
      return null;
    }
  }, [accessToken]);

  // Restore and validate session in background on mount via HttpOnly cookie
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const storedUser = (localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem('myciti_user'));

      // If user is not logged in at all, skip network call
      if (!storedUser) {
        if (isMounted) setIsInitializing(false);
        return;
      }

      // Refresh via HttpOnly cookie
      try {
        const data = await executeRefresh(null);
        if (isMounted) {
          setAccessToken(data.accessToken);
          setUser(data.user);
          persistSession(data);
          setAuthError(null);
        }
      } catch (err) {
        // Only clear storage if backend explicitly rejected credentials (401 or 403)
        // If it's a network glitch or cold-start (502/503/504), keep cached user
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
      const data = await executeRefresh(null);
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
        setAuthError('Your account is suspended. Contact admin@mycite.com');
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
      if (updatedUser) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.warn('Failed to sync location to backend:', err);
      return null;
    }
  }, [accessToken]);

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      await logoutSession();
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
        refreshUserProfile,
        roleChangeNotice,
        clearRoleChangeNotice: () => setRoleChangeNotice(null),
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
