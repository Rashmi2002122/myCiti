import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { handleGoogleLogin, authError, setAuthError } = useAuth();
  const googleBtnRef = useRef(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      setAuthError(null);
      setPopupBlocked(false);
      isInitializedRef.current = false;
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || clientId.includes('placeholder')) {
      console.error('[Google Auth] VITE_GOOGLE_CLIENT_ID is missing or not set in environment variables!');
      setAuthError('Google Client ID is not configured. Please check Vercel environment variables.');
      return;
    }

    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setIsGsiLoaded(true);
        try {
          if (!isInitializedRef.current) {
            window.google.accounts.id.initialize({
              client_id: clientId,
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
            isInitializedRef.current = true;
          }

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
  }, [isOpen]);

  if (!isOpen) return null;

  const isSuspended = authError && authError.includes('suspended');

  return (
    <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Modal Card */}
      <div className="bg-white dark:bg-[#10141c] p-6 sm:p-7 rounded-[5px] max-w-sm w-full shadow-2xl border border-slate-200 dark:border-[#303139] relative animate-in zoom-in-95 duration-160 text-slate-900 dark:text-[#f4f5f7]">
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close login dialog"
          className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#101522] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] cursor-pointer active:scale-95"
        >
          <X className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Content Card */}
        <div className="text-center space-y-4 pt-1">
          {/* Logo icon */}
          <div className="w-13 h-13 bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm text-amber-600 dark:text-[#edcd8c]">
            🪔
          </div>

          <div>
            <h2 className="text-xl font-medium tracking-tight text-slate-900 dark:text-[#f4f5f7]">
              my<span className="text-[#ff951f]">Cite</span>
            </h2>
            <p className="text-xs font-mono text-slate-600 dark:text-[#c9ced8] mt-1">
              Sign in to post your event or offer
            </p>
          </div>

          {/* Suspended message state */}
          {isSuspended ? (
            <div className="p-3 rounded-[4px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-mono space-y-1.5 text-left">
              <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>Account Suspended</span>
              </div>
              <p>Your account is suspended. Contact <a href="mailto:admin@mycite.com" className="underline font-bold text-[#ff951f]">admin@mycite.com</a></p>
            </div>
          ) : authError ? (
            <div className="p-3 rounded-[4px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-mono flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          ) : null}

          {/* Popup blocked / fallback message */}
          {popupBlocked && (
            <div className="p-3 rounded-[4px] bg-amber-50 dark:bg-[#101522] border border-amber-200 dark:border-[#ff951f]/40 text-amber-800 dark:text-[#edcd8c] text-xs font-mono flex items-center justify-between gap-2">
              <span>Google popup was blocked by browser.</span>
              <button
                onClick={() => {
                  setPopupBlocked(false);
                  window.google?.accounts?.id?.prompt();
                }}
                className="font-bold underline text-[#ff951f] flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* Google Button Container */}
          <div className="py-2 flex flex-col items-center justify-center min-h-[50px]">
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#ff951f]">
                <div className="w-4 h-4 border-2 border-[#ff951f] border-t-transparent rounded-full animate-spin" />
                <span>Signing in with Google...</span>
              </div>
            ) : (
              <div ref={googleBtnRef} className="flex justify-center" />
            )}
          </div>

          {/* Privacy Note */}
          <p className="text-[11px] font-mono text-slate-500 dark:text-[#c9ced8]/60 leading-relaxed pt-3 border-t border-slate-100 dark:border-[#303139]">
            We only use your name and email. Browsing the map never needs login.
          </p>
        </div>
      </div>
    </div>
  );
}
