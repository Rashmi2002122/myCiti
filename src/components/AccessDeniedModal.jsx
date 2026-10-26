import React from 'react';
import { X, ShieldAlert, Sparkles, Home } from 'lucide-react';

export default function AccessDeniedModal({
  isOpen,
  onClose,
  requiredRole = 'CLIENT',
  onBecomeClient,
  onGoHome
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3700] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#10141c] p-5 sm:p-6 rounded-[30px] max-w-sm w-full shadow-2xl border border-slate-200 dark:border-[#303139] animate-in zoom-in-95 duration-200 relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close access denied modal"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-md border border-slate-200/80 dark:border-slate-700 active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="bg-white dark:bg-[#10141c] rounded-[24px] p-6 shadow-soft border border-slate-200 dark:border-[#303139] text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              You Don't Have Access
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              {requiredRole === 'ADMIN'
                ? 'This management area requires Administrator permissions.'
                : 'Posting advertisements and running ad campaigns is reserved for Client and Business accounts.'}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            {requiredRole !== 'ADMIN' && onBecomeClient && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBecomeClient();
                }}
                className="w-full min-h-[44px] rounded-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-black text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Apply to Become a Client</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onGoHome) onGoHome();
              }}
              className="w-full min-h-[44px] rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
