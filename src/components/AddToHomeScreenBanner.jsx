import React from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../context/PWAInstallContext';

export default function AddToHomeScreenBanner() {
  const { showBanner, dismissBanner, promptToInstall, isInstalled } = usePWAInstall();

  if (!showBanner || isInstalled) return null;

  return (
    <aside
      aria-label="Add to home screen banner"
      className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 sm:bottom-6 max-w-sm sm:w-96 z-[1600] animate-in slide-in-from-bottom duration-300"
    >
      <div className="bg-gradient-to-r from-white via-sky-50 to-blue-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 rounded-[24px] p-3.5 shadow-2xl border border-city-blue/30 dark:border-slate-700 backdrop-blur-md flex items-center justify-between gap-3">
        {/* App Icon & Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-city-blue/10 dark:bg-city-blue/20 flex items-center justify-center text-city-blue flex-shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                Add to Home Screen
              </h4>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-full bg-city-blue text-white">
                App
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Fast 1-tap launch & offline maps
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={promptToInstall}
            className="min-h-[44px] px-3.5 py-1.5 rounded-full bg-city-blue hover:bg-blue-600 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>

          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss banner"
            className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
