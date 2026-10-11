import React from 'react';
import { X, Share, PlusSquare, Smartphone, Check, Laptop } from 'lucide-react';
import { usePWAInstall } from '../context/PWAInstallContext';

export default function InstallGuideModal() {
  const { isGuideOpen, setIsGuideOpen, isIOS } = usePWAInstall();

  if (!isGuideOpen) return null;

  return (
    <div className="fixed inset-0 z-[3500] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-gradient-to-b from-[#cfe7ff] to-[#eaf4ff] dark:from-slate-900 dark:to-slate-950 p-5 sm:p-6 rounded-[30px] max-w-sm w-full shadow-2xl border border-white/60 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          onClick={() => setIsGuideOpen(false)}
          aria-label="Close install instructions"
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-soft"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[26px] p-5 shadow-soft border border-white/60 dark:border-slate-800 space-y-4">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-city-blue/10 dark:bg-city-blue/20 flex items-center justify-center text-city-blue">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
              Add myCiti to Home Screen
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Install the app for instant full-screen access and offline maps
            </p>
          </div>

          {/* Steps */}
          {isIOS ? (
            <div className="space-y-3 pt-2 text-xs text-slate-700 dark:text-slate-200">
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-sky-50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700">
                <div className="w-7 h-7 rounded-full bg-city-blue text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Tap the Share button</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    Tap <Share className="w-3.5 h-3.5 text-city-blue inline" /> in Safari's bottom toolbar
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-sky-50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700">
                <div className="w-7 h-7 rounded-full bg-city-blue text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Select "Add to Home Screen"</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-city-blue inline" /> <b>Add to Home Screen</b>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-sky-50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700">
                <div className="w-7 h-7 rounded-full bg-city-blue text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Confirm by tapping "Add"</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Tap <b>Add</b> at the top right to place myCiti on your home screen
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2 text-xs text-slate-700 dark:text-slate-200">
              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-sky-50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700">
                <div className="w-7 h-7 rounded-full bg-city-blue text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                  <Laptop className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Browser Install Icon</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Look for the <b>Install</b> or <b>⊕</b> icon in your browser address bar or menu.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-sky-50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs shadow-sm">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">Instant Access</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Once added, myCiti launches as a standalone app with offline map support.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={() => setIsGuideOpen(false)}
            className="w-full min-h-[44px] py-2.5 px-4 bg-city-blue hover:bg-blue-600 active:scale-[0.98] text-white rounded-2xl font-bold text-xs shadow-md transition-all"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
