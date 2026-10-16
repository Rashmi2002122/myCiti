import React from 'react';
import { X, ShieldCheck, MapPin, Bell, Lock, Trash2, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyModal({ isOpen, onClose, onOpenSettings }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative my-8">
        {/* Header Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
              Privacy & Location Notice
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Transparent, privacy-first community guidelines
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 max-h-[60vh] overflow-y-auto pr-1">
          {/* Section 1: Guiding Principle */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-slate-800/60 rounded-2xl border border-blue-100 dark:border-slate-700/80 space-y-1">
            <div className="font-bold text-city-blue dark:text-blue-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Our Privacy Commitment</span>
            </div>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              myCiti is built to connect neighborhoods with local pandals, melas, cultural announcements, and local stores—without tracking you.
            </p>
          </div>

          {/* Section 2: What we collect */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              What We Collect (Only With Your Consent)
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-city-blue mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">Coarse Location (~1 km accuracy): </span>
                  When you set your area or tap "Use my location", coordinates are intentionally rounded to ~0.01° (approx. 1 km). We never store high-precision GPS coordinates.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Bell className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">Push Tokens: </span>
                  If you opt in to web push notifications, your browser's push subscription endpoint is stored solely to deliver emergency or local announcements.
                </div>
              </li>
            </ul>
          </div>

          {/* Section 3: What we NEVER do */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              What We NEVER Do
            </h3>
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">No Continuous Background Tracking: </span>
                  We do not poll, track, or record your movement when the app is closed or in the background.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">No Location History: </span>
                  Only your most recent chosen coarse area is saved. Past locations are never recorded.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">No User Lists for Advertisers: </span>
                  Advertisers and clients only see aggregate audience ranges (e.g. "50–200 people"). If fewer than 10 people match a zone, counts are masked as "&lt; 10". Advertisers never see your identity, profile, or exact location.
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Your Rights & Deletion */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Your Control & Deletion Rights
            </h3>
            <p className="leading-relaxed mb-3">
              You can view, modify, or permanently delete your stored area and notification subscriptions at any time with a single click.
            </p>
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Manage or Delete My Location Data</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-city-blue text-white font-bold text-xs hover:bg-blue-600 transition-colors shadow-soft"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
