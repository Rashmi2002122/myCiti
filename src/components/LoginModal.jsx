import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { handleGoogleLogin, authError, setAuthError } = useAuth();
  const googleBtnRef = useRef(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setAuthError(null);
      setPopupBlocked(false);
      return;
    }

    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setIsGsiLoaded(true);
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder-google-client-id.apps.googleusercontent.com',
            callback: async (response) => {
              if (response?.credential) {
                try {
                  setIsLoading(true);
                  await handleGoogleLogin(response.credential);
                  onClose();
                } catch (e) {
                  console.error('Login callback error:', e);
                } finally {
                  setIsLoading(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'pill',
              text: 'signin_with',
              logo_alignment: 'left',
              width: 280,
            });
          }
        } catch (err) {
          console.warn('GSI render error:', err);
        }
      } else {
        setTimeout(checkGsi, 200);
      }
    };

    checkGsi();
  }, [isOpen, handleGoogleLogin, onClose, setAuthError]);

  if (!isOpen) return null;

  const isSuspended = authError && authError.includes('suspended');

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="bg-gradient-to-b from-[#cfe7ff] to-[#eaf4ff] dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8 rounded-[28px] max-w-md w-full shadow-2xl border border-white/60 dark:border-slate-800 relative animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close login dialog"
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-soft"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Card */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[24px] p-6 text-center shadow-soft border border-white/60 dark:border-slate-800 space-y-4">
          {/* Logo icon */}
          <div className="w-14 h-14 bg-sky-base dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
            🪔
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              my<span className="text-city-blue">Citi</span>
            </h2>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
              Sign in to post your event or offer
            </p>
          </div>

          {/* Suspended message state */}
          {isSuspended ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium space-y-2 text-left">
              <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Account Suspended</span>
              </div>
              <p>Your account is suspended. Contact <a href="mailto:admin@myciti.com" className="underline font-bold">admin@myciti.com</a></p>
            </div>
          ) : authError ? (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          ) : null}

          {/* Popup blocked / fallback message */}
          {popupBlocked && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-800 dark:text-amber-200 text-xs font-medium flex items-center justify-between gap-2">
              <span>Google popup was blocked by browser.</span>
              <button
                onClick={() => {
                  setPopupBlocked(false);
                  window.google?.accounts?.id?.prompt();
                }}
                className="font-bold underline text-city-blue flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* Google Button Container */}
          <div className="py-2 flex flex-col items-center justify-center min-h-[50px]">
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs font-bold text-city-blue">
                <div className="w-4 h-4 border-2 border-city-blue border-t-transparent rounded-full animate-spin" />
                <span>Signing in with Google...</span>
              </div>
            ) : (
              <div ref={googleBtnRef} className="flex justify-center" />
            )}
          </div>

          {/* Privacy Note */}
          <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            We only use your name and email. Browsing the map never needs login.
          </p>
        </div>
      </div>
    </div>
  );
}
