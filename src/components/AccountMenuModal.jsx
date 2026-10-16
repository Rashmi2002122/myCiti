import React from 'react';
import { useAuth } from '../context/AuthContext';
import { usePWAInstall } from '../context/PWAInstallContext';
import {
  X, User, Shield, LogOut, Phone, Store, Building2,
  CheckCircle, AlertTriangle, ExternalLink, Settings, Sun, Moon,
  Smartphone, MapPin, ShieldCheck
} from 'lucide-react';

export default function AccountMenuModal({
  isOpen,
  onClose,
  onOpenCompleteProfile,
  onOpenAdminPanel,
  onOpenMyPosts,
  onOpenPostAd,
  onOpenCampaigns,
  onOpenMyArea,
  onOpenPrivacyNotice,
  darkMode,
  onToggleDarkMode
}) {
  const { user, isAdmin, isClient, canPost, isConsumer, handleLogout } = useAuth();
  const { isInstalled, promptToInstall } = usePWAInstall();

  if (!isOpen || !user) return null;

  const getAccountTypeBadge = () => {
    switch (user.accountType) {
      case 'STORE':
        return { label: 'Store', icon: Store, bg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' };
      case 'COMPANY':
        return { label: 'Company', icon: Building2, bg: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300' };
      default:
        return { label: 'Individual', icon: User, bg: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' };
    }
  };

  const accountTypeInfo = getAccountTypeBadge();
  const TypeIcon = accountTypeInfo.icon;

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#cfe7ff] to-[#eaf4ff] dark:from-slate-900 dark:to-slate-950 p-6 rounded-[30px] max-w-sm w-full shadow-2xl border border-white/60 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close account menu"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-soft"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Card */}
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[26px] p-6 shadow-soft border border-white/60 dark:border-slate-800 space-y-5">
          {/* User Profile Header */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="relative">
              {user.pictureUrl ? (
                <img
                  src={user.pictureUrl}
                  alt={user.name || 'User'}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-sky-base dark:bg-slate-800 flex items-center justify-center text-2xl font-black text-city-blue shadow-md">
                  {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                </div>
              )}
              {isAdmin && (
                <span
                  title="Administrator"
                  className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-sm text-xs"
                >
                  👑
                </span>
              )}
            </div>

            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {user.name || 'myCiti Member'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {user.email}
              </p>
            </div>

            {/* Badges: Role and Account Type */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center pt-1">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${accountTypeInfo.bg}`}>
                <TypeIcon className="w-3 h-3" />
                <span>{accountTypeInfo.label}</span>
              </span>

              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800">
                  <Shield className="w-3 h-3 text-amber-600" />
                  ADMIN
                </span>
              ) : isClient ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Store className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  CLIENT
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <User className="w-3 h-3 text-slate-500" />
                  USER
                </span>
              )}
            </div>
          </div>

          {/* Business / Phone detail if available */}
          {(user.businessName || user.phone) && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl text-xs space-y-1.5 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
              {user.businessName && (
                <div className="font-semibold truncate">
                  🏢 {user.businessName}
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-city-blue" />
                  <span>+91 {user.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Profile Incomplete Banner for Client/Admin */}
          {!user.profileComplete && canPost && (
            <div
              onClick={() => {
                onClose();
                onOpenCompleteProfile();
              }}
              className="cursor-pointer p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-between gap-2 hover:bg-amber-100/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Profile incomplete</span>
              </div>
              <span className="text-[11px] underline font-bold">Complete Now</span>
            </div>
          )}

          {/* Actions Menu */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {/* Post an Advertisement - CLIENT / ADMIN only */}
            {canPost && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenPostAd) onOpenPostAd();
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-city-blue hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-between transition-transform active:scale-[0.98] shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">✨</span>
                    <span>Post an Advertisement</span>
                  </div>
                  <span className="text-[11px] font-extrabold">&rarr;</span>
                </button>

                {/* My Advertisements Link */}
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenMyPosts) onOpenMyPosts();
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-sky-50 dark:bg-slate-800/80 hover:bg-sky-100 dark:hover:bg-slate-800 text-city-blue dark:text-blue-400 font-bold text-xs flex items-center justify-between transition-colors border border-sky-200/60 dark:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📢</span>
                    <span>My Advertisements</span>
                  </div>
                  <span className="text-[11px] text-slate-400">&rarr;</span>
                </button>

                {/* Marketing & Geo Campaigns */}
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenCampaigns) onOpenCampaigns();
                  }}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-bold text-xs flex items-center justify-between transition-colors border border-amber-200/60 dark:border-amber-900"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎯</span>
                    <span>Marketing & Geo Ads</span>
                  </div>
                  <span className="text-[11px] text-slate-400">&rarr;</span>
                </button>
              </>
            )}

            {/* Upgrade to Business / Client Account CTA for Consumers */}
            {isConsumer && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCompleteProfile();
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-between transition-transform active:scale-[0.98] shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🏢</span>
                  <div className="text-left">
                    <div className="font-extrabold leading-tight">Register Your Business</div>
                    <div className="text-[10px] text-blue-100 font-normal">Become a Client to post ads & listings</div>
                  </div>
                </div>
                <span className="text-[11px] font-extrabold">&rarr;</span>
              </button>
            )}

            {/* Edit / Complete Profile */}
            <button
              onClick={() => {
                onClose();
                onOpenCompleteProfile();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Edit Profile</span>
              </div>
              <span className="text-[11px] text-slate-400">&rarr;</span>
            </button>

            {/* My Area & Targeting Preferences */}
            <button
              onClick={() => {
                onClose();
                if (onOpenMyArea) onOpenMyArea();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-sky-50 dark:bg-slate-800/80 hover:bg-sky-100 dark:hover:bg-slate-800 text-city-blue dark:text-blue-400 font-bold text-xs flex items-center justify-between transition-colors border border-sky-100 dark:border-slate-700/60"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-city-blue dark:text-blue-400" />
                <span>My Area & Targeting</span>
              </div>
              <span className="text-[11px] text-slate-400">&rarr;</span>
            </button>

            {/* Privacy Notice */}
            <button
              onClick={() => {
                onClose();
                if (onOpenPrivacyNotice) onOpenPrivacyNotice();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Privacy & Data Protection</span>
              </div>
              <span className="text-[11px] text-slate-400">&rarr;</span>
            </button>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                {darkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-500" />
                )}
                <span>Theme</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-extrabold shadow-2xs">
                <span>{darkMode ? 'Dark' : 'Light'}</span>
                <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-amber-400' : 'bg-city-blue'}`} />
              </div>
            </button>

            {/* Add to Home Screen / Install PWA */}
            <button
              type="button"
              onClick={async () => {
                onClose();
                await promptToInstall();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-city-blue" />
                <span>Add to Home Screen</span>
              </div>
              <div className="flex items-center gap-1.5 bg-city-blue/10 dark:bg-city-blue/20 text-city-blue px-2.5 py-1 rounded-full text-[10px] font-extrabold">
                {isInstalled ? 'Installed' : 'Install'}
              </div>
            </button>

            {/* Admin Link - ONLY visible to ADMIN users */}
            {isAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-city-blue font-bold text-xs flex items-center justify-between transition-colors border border-blue-200/60 dark:border-blue-900"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Logout */}
            <button
              onClick={async () => {
                await handleLogout();
                onClose();
              }}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
