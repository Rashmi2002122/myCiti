import React, { useState } from 'react';
import { ShieldCheck, MapPin, Bell, X, Check, ArrowRight } from 'lucide-react';

export default function PrivacyConsentModal({
  isOpen,
  onClose,
  onAccept,
  onConsentApplied,
  onOpenPrivacyNotice
}) {
  const [allowLocation, setAllowLocation] = useState(false);
  const [allowPush, setAllowPush] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    try {
      localStorage.setItem('myciti_consent_dismissed', 'true');
    } catch (e) {
      // Ignore storage errors
    }

    const callback = onConsentApplied || onAccept;
    if (typeof callback === 'function') {
      callback({
        location: allowLocation,
        push: allowPush,
        allowLocation,
        allowPush
      });
    }

    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem('myciti_consent_dismissed', 'true');
    } catch (e) {
      // Ignore storage errors
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[3200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#cfe7ff] to-[#eaf4ff] dark:from-slate-900 dark:to-slate-950 p-6 rounded-[30px] max-w-md w-full shadow-2xl border border-white/60 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative">
        <button
          onClick={handleDismiss}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-soft"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[26px] p-6 shadow-soft border border-white/60 dark:border-slate-800 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-sky-base dark:bg-slate-800 text-city-blue rounded-full flex items-center justify-center mx-auto text-xl shadow-sm">
              <ShieldCheck className="w-6 h-6 text-city-blue" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Privacy & Preferences
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              myCiti respects your privacy. We never track your continuous background location or store exact coordinates.
            </p>
          </div>

          <div className="space-y-3">
            {/* Location Consent Item */}
            <div
              onClick={() => setAllowLocation(!allowLocation)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                allowLocation
                  ? 'border-city-blue bg-blue-50/70 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 border transition-colors ${
                allowLocation ? 'bg-city-blue border-city-blue text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
              }`}>
                {allowLocation && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-city-blue" />
                  <span>Set My Approximate Area</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Stores only a coarse location (rounded to ~1 km), used only to show relevant pandals and offers. No continuous background tracking.
                </p>
              </div>
            </div>

            {/* Notification Consent Item */}
            <div
              onClick={() => setAllowPush(!allowPush)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                allowPush
                  ? 'border-city-blue bg-blue-50/70 dark:bg-blue-950/30'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/60'
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 border transition-colors ${
                allowPush ? 'bg-city-blue border-city-blue text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
              }`}>
                {allowPush && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-city-blue" />
                  <span>Announcement Notifications</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Receive short alerts (aarti times, traffic notices, flash offers) for your chosen area via Web Push and in-app alerts.
                </p>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <p>🔒 <strong>Your Control:</strong> You can change or delete your area and unsubscribe anytime from your account menu.</p>
            {onOpenPrivacyNotice && (
              <button
                type="button"
                onClick={() => {
                  handleDismiss();
                  onOpenPrivacyNotice();
                }}
                className="text-city-blue dark:text-blue-400 font-bold underline hover:opacity-80 block pt-0.5 text-left"
              >
                Read our Privacy & Location Notice &rarr;
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
            >
              Not Now
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-full bg-city-blue hover:bg-blue-600 text-white font-extrabold text-xs transition-transform active:scale-[0.98] shadow-md flex items-center justify-center gap-1"
            >
              <span>Confirm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
