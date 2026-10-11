import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { refreshSession, logoutSession, loginWithGoogle } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // In-memory access token (never persisted in localStorage)
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Restore session on mount via /api/auth/refresh cookie
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const data = await refreshSession();
        if (isMounted) {
          setAccessToken(data.accessToken);
          setUser(data.user);
          setAuthError(null);
        }
      } catch (err) {
        // No active or valid cookie; normal unauthenticated state
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
      const data = await refreshSession();
      setAccessToken(data.accessToken);
      setUser(data.user);
      return data.accessToken;
    } catch (err) {
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
      return data;
    } catch (err) {
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
      await logoutSession();
    } catch (e) {
      console.warn('Logout request warning:', e);
    } finally {
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
