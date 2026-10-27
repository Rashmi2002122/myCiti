import React, { useState } from 'react';
import {
  X, Sun, Moon, Globe, Bell,
  Check, ChevronRight, AlertTriangle, Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettingsModal({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
  onOpenNotifications,
  onOpenEditBusinessProfile
}) {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  if (!isOpen) return null;

  const languages = [
    { code: 'en', label: 'English', native: 'English', active: true },
    { code: 'bn', label: 'Bengali', native: 'বাংলা', active: false },
    { code: 'or', label: 'Odia', native: 'ଓଡ଼ିଆ', active: false },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी', active: false }
  ];

  const handleDeleteRequest = () => {
    const userEmail = user?.email || '';
    const subject = encodeURIComponent('Account Deletion Request - myCiti');
    const body = encodeURIComponent(
      `Hello myCiti Support,\n\nPlease delete my account and associated data.\nRegistered Email: ${userEmail}\nUser Name: ${user?.name || ''}\n\nThank you.`
    );
    window.location.href = `mailto:admin@myciti.com?subject=${subject}&body=${body}`;
    setIsDeleteConfirmOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-[3500] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-160"
    >
      <div className="bg-white dark:bg-[#10141c] p-5 sm:p-6 rounded-[24px] max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#303139] animate-in zoom-in-95 duration-160 relative my-auto text-slate-900 dark:text-[#f4f5f7]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#101522] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="space-y-4 pt-1">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-city-blue/10 text-city-blue flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-medium tracking-tight text-slate-900 dark:text-[#f4f5f7]">
                App Settings
              </h2>
              <p className="text-xs font-mono text-slate-500 dark:text-[#c9ced8]">
                Preferences, appearance & account options
              </p>
            </div>
          </div>

          {/* Setting Section 1: Appearance */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Appearance
            </span>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-2xs">
                  {darkMode ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Theme Mode
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {darkMode ? 'Dark Theme' : 'Light Sky Theme'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                onClick={onToggleDarkMode}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                  darkMode ? 'bg-[#ff951f] justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
              </button>
            </div>
          </div>

          {/* Business Profile Settings for CLIENT / ADMIN */}
          {onOpenEditBusinessProfile && (
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Business Profile
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEditBusinessProfile();
                }}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-2xs">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Edit Business Profile
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Name, hours, cover, logo & contact info
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* Setting Section 2: Language (Placeholder for Odia, Hindi, Bengali) */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Language (Beta)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((lang) => {
                const isSelected = selectedLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      if (lang.active) {
                        setSelectedLanguage(lang.code);
                      } else {
                        alert(`${lang.label} (${lang.native}) translations are coming in the next release!`);
                      }
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-city-blue bg-blue-50/70 dark:bg-blue-950/40 text-city-blue font-black'
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{lang.label}</div>
                      <div className="text-[11px] text-slate-400">{lang.native}</div>
                    </div>
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 text-city-blue" />
                    ) : !lang.active && (
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        Soon
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Setting Section 3: Notification Preferences Shortcut */}
          {onOpenNotifications && (
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Alerts & Categories
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNotifications('preferences');
                }}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950 text-city-blue flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Notification Preferences
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Pandal, Mela, Offer & Inauguration toggles
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* Setting Section 4: Account Privacy & Data */}
          <div className="space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Account & Privacy
            </span>
            <div className="p-3.5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Delete Account Request
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Permanently remove profile and all saved items
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
              >
                Request
              </button>
            </div>
          </div>

          {/* App Info Footer */}
          <div className="pt-2 text-center text-[11px] text-slate-400 space-y-0.5 border-t border-slate-100 dark:border-slate-800">
            <div className="font-bold text-slate-500 dark:text-slate-400">myCiti PWA v2.0.0</div>
            <div>Designed for Durga Puja & Year-Round Community Events</div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">Map Data &copy; OpenFreeMap &bull; &copy; OpenStreetMap contributors</div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[4000] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto shadow-md">
              <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Request Account Deletion?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                This will send an official deletion request to <strong>admin@myciti.com</strong>. Your account, submissions, and bookmarks will be purged.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 min-h-[42px] rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRequest}
                className="flex-1 min-h-[42px] rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
