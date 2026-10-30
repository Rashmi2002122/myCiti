import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PWAInstallContext = createContext(null);

const STORAGE_DISMISSED_KEY = 'mycite_a2hs_dismissed';
const DISMISS_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

function checkIsInstalled() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

function checkIsIOS() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && !window.MSStream;
}

export function PWAInstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(checkIsInstalled);
  const [isIOS] = useState(checkIsIOS);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    // If already installed, do not show install options
    if (checkIsInstalled()) {
      setIsInstalled(true);
      setShowBanner(false);
      return;
    }

    // Check if user dismissed banner recently
    const dismissedAt = localStorage.getItem(STORAGE_DISMISSED_KEY) || localStorage.getItem('myciti_a2hs_dismissed');
    const isDismissActive = dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION_MS;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);

      if (!isDismissActive && !checkIsInstalled()) {
        // Small delay so it does not interfere with initial page load
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 2500);
        return () => clearTimeout(timer);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowBanner(false);
      setDeferredPrompt(null);
      localStorage.removeItem(STORAGE_DISMISSED_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS where beforeinstallprompt does not fire:
    if (checkIsIOS() && !checkIsInstalled() && !isDismissActive) {
      setIsInstallable(true);
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, Date.now().toString());
    } catch {
      // Ignore quota errors
    }
  }, []);

  const promptToInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        if (choiceResult?.outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
          return 'accepted';
        }
        return 'dismissed';
      } catch (err) {
        console.error('Error invoking install prompt:', err);
      }
    } else if (isIOS) {
      setIsGuideOpen(true);
      return 'ios_guide';
    } else {
      setIsGuideOpen(true);
      return 'guide';
    }
  }, [deferredPrompt, isIOS]);

  const value = {
    deferredPrompt,
    isInstalled,
    isIOS,
    isInstallable: isInstallable || !isInstalled,
    showBanner,
    dismissBanner,
    promptToInstall,
    isGuideOpen,
    setIsGuideOpen,
  };

  return (
    <PWAInstallContext.Provider value={value}>
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  const context = useContext(PWAInstallContext);
  if (!context) {
    throw new Error('usePWAInstall must be used within a PWAInstallProvider');
  }
  return context;
}
