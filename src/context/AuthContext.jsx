import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { refreshSession, logoutSession, loginWithGoogle, updateMyCoarseLocation, getMyProfile } from '../services/api';

const AuthContext = createContext(null);

const USER_STORAGE_KEY = 'myciti_user';
const ACCESS_TOKEN_STORAGE_KEY = 'myciti_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'myciti_refresh_token';

// Check if JWT access token has expired (or is close to expiring within 30s)
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return !payload.exp || (payload.exp * 1000) < (Date.now() + 30000);
  } catch {
    return true;
  }
}

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
  if (data?.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, data.refreshToken);
  }
}

function clearSessionStorage() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
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
  const [roleChangeNotice, setRoleChangeNotice] = useState(null);

  // Check for role change on user change
  useEffect(() => {
    if (user?.role) {
      const knownRole = localStorage.getItem('myciti_known_role');
      if (knownRole && knownRole !== user.role) {
        setRoleChangeNotice({
          oldRole: knownRole,
          newRole: user.role
        });
      }
      localStorage.setItem('myciti_known_role', user.role);
    }
  }, [user?.role]);

  const refreshUserProfile = useCallback(async () => {
    const token = accessToken || localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    if (!token) return null;
    try {
      const profile = await getMyProfile(token);
      setUser(profile);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.warn('Failed to refresh user profile:', err);
      return null;
    }
  }, [accessToken]);

  // Restore and validate session in background on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);

      // If user is not logged in at all, skip network call
      if (!storedAccessToken && !storedUser && !storedRefreshToken) {
        if (isMounted) setIsInitializing(false);
        return;
      }

      // If the cached access token is still completely valid, user is authenticated immediately
      if (storedAccessToken && !isTokenExpired(storedAccessToken) && storedUser) {
        if (isMounted) {
          setIsInitializing(false);
        }
        return;
      }

      // If access token is expired or missing, refresh via HttpOnly cookie or stored refresh token
      try {
        const data = await executeRefresh(storedRefreshToken);
        if (isMounted) {
          setAccessToken(data.accessToken);
          setUser(data.user);
          persistSession(data);
          setAuthError(null);
        }
      } catch (err) {
        // Only warn if the user was expected to have an active session
        if (storedAccessToken && isTokenExpired(storedAccessToken)) {
          console.warn('[Auth] Session validation/refresh notice:', err?.message || err);
        }
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
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      const data = await executeRefresh(storedRefreshToken);
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
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    try {
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