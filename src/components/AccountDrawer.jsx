import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, User, Shield, LogOut, Phone, Store, Building2,
  Bookmark, Bell, Settings, Sparkles, FileText, PlusCircle,
  ClipboardList, UserCheck, ChevronDown, ChevronUp, ChevronRight,
  Sun, Moon, HelpCircle, Mail, FileCheck, Info, AlertCircle,
  ExternalLink, LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyProfile, fetchMyClientRequest } from '../services/api';

export default function AccountDrawer({
  isOpen,
  onClose,
  onNavigate,
  onOpenCompleteProfile,
  onOpenMyPosts,
  onOpenPostAd,
  onOpenCampaigns,
  onOpenAdmin,
  onOpenNotifications,
  onOpenLogin,
  onOpenBecomeClient,
  onOpenDeclineInfo,
  darkMode,
  onToggleDarkMode,
  triggerRef
}) {
  const { user, accessToken, isAuthenticated, isAdmin, isClient, handleLogout } = useAuth();

  const [counts, setCounts] = useState(null);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [latestClientRequest, setLatestClientRequest] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const drawerRef = useRef(null);
  const touchStartXRef = useRef(null);

  // Determine active role
  const role = user?.role || 'USER';

  // Load latest profile counts and client request when drawer opens
  const loadDrawerData = useCallback(async () => {
    if (!accessToken || !isAuthenticated) return;
    try {
      setIsLoadingCounts(true);
      const [profileData, reqData] = await Promise.all([
        getMyProfile(accessToken).catch(() => null),
        role === 'USER' ? fetchMyClientRequest(accessToken).catch(() => null) : Promise.resolve(null)
      ]);

      if (profileData?.counts) {
        setCounts(profileData.counts);
      }
      if (reqData) {
        setLatestClientRequest(reqData);
      }
    } catch (e) {
      console.warn('Failed to load drawer stats:', e);
    } finally {
      setIsLoadingCounts(false);
    }
  }, [accessToken, isAuthenticated, role]);

  useEffect(() => {
    if (isOpen) {
      loadDrawerData();
    }
  }, [isOpen, loadDrawerData]);

  // Lock body scroll and trap focus when open
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus drawer on open
    const drawerElement = drawerRef.current;
    if (drawerElement) {
      const focusable = drawerElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      // Return focus to trigger
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, onClose, triggerRef]);

  // Swipe-to-close handlers
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartXRef.current;
    // Swiped left > 50px
    if (deltaX < -50) {
      onClose();
    }
    touchStartXRef.current = null;
  };

  // Single Menu items configuration
  const MENU_CONFIG = [
    // Everyone signed in
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      roles: ['USER', 'CLIENT', 'ADMIN'],
      action: () => {
        onClose();
        if (onOpenCompleteProfile) onOpenCompleteProfile();
      }
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: Bookmark,
      roles: ['USER', 'CLIENT', 'ADMIN'],
      badgeKey: 'savedCount',
      action: () => {
        onClose();
        if (onNavigate) onNavigate('saved');
      }
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Preferences by category & push',
      icon: Bell,
      roles: ['USER', 'CLIENT', 'ADMIN'],
      action: () => {
        onClose();
        if (onOpenNotifications) onOpenNotifications('preferences');
      }
    },
    // USER only
    {
      id: 'become_client',
      label: 'Become a client',
      icon: Sparkles,
      roles: ['USER'],
      isSpecial: true,
      action: () => {
        if (latestClientRequest?.status === 'DECLINED') {
          if (onOpenDeclineInfo) onOpenDeclineInfo(latestClientRequest);
        } else if (latestClientRequest?.status === 'PENDING') {
          // View status or info
        } else {
          onClose();
          if (onOpenBecomeClient) onOpenBecomeClient();
        }
      }
    },
    // CLIENT & ADMIN
    {
      id: 'my_posts',
      label: 'My posts',
      icon: FileText,
      roles: ['CLIENT', 'ADMIN'],
      badgeKey: 'pendingCount',
      badgeLabel: 'pending',
      action: () => {
        onClose();
        if (onOpenMyPosts) onOpenMyPosts();
      }
    },
    {
      id: 'post_ad',
      label: 'Post an ad',
      icon: PlusCircle,
      roles: ['CLIENT', 'ADMIN'],
      action: () => {
        onClose();
        if (onOpenPostAd) onOpenPostAd();
      }
    },
    {
      id: 'business_profile',
      label: 'Business profile',
      icon: Building2,
      roles: ['CLIENT', 'ADMIN'],
      action: () => {
        onClose();
        if (onOpenCompleteProfile) onOpenCompleteProfile();
      }
    },
    {
      id: 'campaigns',
      label: 'Ad Campaigns',
      icon: Sparkles,
      roles: ['CLIENT', 'ADMIN'],
      action: () => {
        onClose();
        if (onOpenCampaigns) onOpenCampaigns();
      }
    },
    // ADMIN only
    {
      id: 'review_queue',
      label: 'Review queue',
      icon: ClipboardList,
      roles: ['ADMIN'],
      badgeKey: 'pendingReviewCount',
      action: () => {
        onClose();
        if (onOpenAdmin) onOpenAdmin('REVIEW');
      }
    },
    {
      id: 'client_requests',
      label: 'Client requests',
      icon: UserCheck,
      roles: ['ADMIN'],
      badgeKey: 'pendingClientRequestCount',
      action: () => {
        onClose();
        if (onOpenAdmin) onOpenAdmin('CLIENT_REQUESTS');
      }
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Shield,
      roles: ['ADMIN'],
      action: () => {
        onClose();
        if (onOpenAdmin) onOpenAdmin('USERS');
      }
    },
    // Settings for everyone signed in
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      roles: ['USER', 'CLIENT', 'ADMIN'],
      action: () => {
        onClose();
        if (onOpenNotifications) onOpenNotifications('preferences');
      }
    }
  ];

  // Filter items by role
  const visibleMenuItems = MENU_CONFIG.filter((item) => item.roles.includes(role));

  const getRoleBadge = () => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'Admin',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-800'
        };
      case 'CLIENT':
        return {
          label: 'Client',
          badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
        };
      default:
        return {
          label: 'User',
          badgeClass: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
        };
    }
  };

  const roleBadge = getRoleBadge();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000]">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-250 animate-in fade-in"
      />

      {/* Drawer Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Account navigation drawer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="fixed top-0 bottom-0 left-0 z-[3001] w-[82vw] max-w-[340px] sm:w-[360px] bg-gradient-to-b from-[#cfe7ff] via-[#e2efff] to-[#eaf4ff] dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-r-[32px] sm:rounded-r-[36px] shadow-2xl border-r border-white/60 dark:border-slate-800 flex flex-col h-full overflow-hidden transform transition-transform duration-250 ease-out motion-reduce:transition-none translate-x-0"
      >
        {/* Drawer Header Controls */}
        <div className="pt-[max(1rem,env(safe-area-inset-top))] px-5 pb-3 flex items-center justify-between">
          <span className="text-xs font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Account Menu
          </span>
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle color theme"
              className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-sm border border-white/60 dark:border-slate-700 cursor-pointer active:scale-95"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="w-10 h-10 rounded-full bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-sm border border-white/60 dark:border-slate-700 cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4 no-scrollbar">
          {isAuthenticated && user ? (
            <>
              {/* User Identity Card */}
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-[26px] p-4 shadow-soft border border-white/70 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  {user.pictureUrl ? (
                    <img
                      src={user.pictureUrl}
                      alt={user.name || 'User'}
                      className="w-14 h-14 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-city-blue/10 dark:bg-sky-500/20 text-city-blue dark:text-sky-400 flex items-center justify-center text-xl font-black shadow-md flex-shrink-0">
                      {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-base font-black text-slate-900 dark:text-slate-100 truncate">
                        {user.name || 'myCiti Member'}
                      </h2>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleBadge.badgeClass}`}>
                        {roleBadge.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      {user.email}
                    </p>

                    {/* Business Name for CLIENT */}
                    {role === 'CLIENT' && user.businessName && (
                      <div className="flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 mt-1 truncate">
                        <Store className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{user.businessName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Row (Replaces Twitter Followers/Following) */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {isLoadingCounts && !counts ? (
                    <div className="grid grid-cols-2 gap-2 animate-pulse">
                      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                    </div>
                  ) : role === 'USER' ? (
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onNavigate) onNavigate('saved');
                        }}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {counts?.savedCount ?? 0}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Saved
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenNotifications) onOpenNotifications('preferences');
                        }}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="text-sm font-black text-city-blue">
                          Active
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Alerts
                        </div>
                      </button>
                    </div>
                  ) : role === 'CLIENT' ? (
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenMyPosts) onOpenMyPosts();
                        }}
                        className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="text-sm font-black text-slate-900 dark:text-slate-100">
                          {(counts?.approvedCount || 0) + (counts?.pendingCount || 0)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Posts
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenMyPosts) onOpenMyPosts();
                        }}
                        className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="text-sm font-black text-emerald-600">
                          {counts?.approvedCount ?? 0}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Approved
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenMyPosts) onOpenMyPosts();
                        }}
                        className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="text-sm font-black text-amber-500">
                          {counts?.pendingCount ?? 0}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Pending
                        </div>
                      </button>
                    </div>
                  ) : (
                    // ADMIN stats
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenAdmin) onOpenAdmin('REVIEW');
                        }}
                        className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 transition-colors border border-amber-200/50 dark:border-amber-900/50"
                      >
                        <div className="text-sm font-black text-amber-700 dark:text-amber-300">
                          {counts?.pendingReviewCount ?? 0}
                        </div>
                        <div className="text-[10px] font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                          To Review
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenAdmin) onOpenAdmin('CLIENT_REQUESTS');
                        }}
                        className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-950/50 transition-colors border border-blue-200/50 dark:border-blue-900/50"
                      >
                        <div className="text-sm font-black text-city-blue">
                          {counts?.pendingClientRequestCount ?? 0}
                        </div>
                        <div className="text-[10px] font-extrabold text-blue-800 dark:text-blue-400 uppercase tracking-wider">
                          Client Reqs
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Menu List */}
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-[26px] p-2 shadow-soft border border-white/70 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/80">
                {visibleMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isSpecial = item.isSpecial;

                  return (
                    <div key={item.id} className="p-1">
                      <button
                        type="button"
                        onClick={item.action}
                        className={`w-full min-h-[52px] px-3.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSpecial
                            ? 'bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/30 text-city-blue font-black hover:from-blue-100 hover:to-sky-100'
                            : 'text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isSpecial
                              ? 'bg-city-blue text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-black tracking-tight">
                            {item.label}
                          </span>
                        </div>

                        {/* Badges / Status Pills */}
                        <div className="flex items-center gap-1.5">
                          {/* "Become a client" special pill status */}
                          {item.id === 'become_client' && (
                            latestClientRequest?.status === 'PENDING' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Under review
                              </span>
                            ) : latestClientRequest?.status === 'DECLINED' ? (
                              <div className="flex items-center gap-1">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                  Declined
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenDeclineInfo) onOpenDeclineInfo(latestClientRequest);
                                  }}
                                  aria-label="View decline reason"
                                  className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950 flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                  <Info className="w-3.5 h-3.5 stroke-[2.5]" />
                                </button>
                              </div>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-city-blue text-white shadow-xs">
                                Apply
                              </span>
                            )
                          )}

                          {/* Numeric Badges */}
                          {item.badgeKey && counts?.[item.badgeKey] > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black bg-rose-500 text-white flex items-center justify-center shadow-xs">
                              {counts[item.badgeKey]}
                            </span>
                          )}

                          <ChevronRight className="w-4 h-4 text-slate-400 opacity-60" />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Collapsible Help & Support Section */}
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-[26px] p-2 shadow-soft border border-white/70 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(!isHelpOpen)}
                  className="w-full min-h-[48px] px-3.5 rounded-2xl flex items-center justify-between text-left text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-slate-500" />
                    <span>Help & Support</span>
                  </div>
                  {isHelpOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isHelpOpen && (
                  <div className="pt-2 pb-1 px-2 space-y-1 text-xs border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-150">
                    <a
                      href="mailto:admin@myciti.com?subject=myCiti%20Help%20and%20Support"
                      className="flex items-center justify-between p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-city-blue" />
                        <span>Contact Admin</span>
                      </div>
                      <span className="text-[10px] text-slate-400">admin@myciti.com</span>
                    </a>

                    <div className="p-2 rounded-xl text-slate-600 dark:text-slate-300 font-medium">
                      <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">About myCiti</div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        Kolkata's community guide for Durga Puja pandals, artisan melas, and neighborhood offers.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Signed Out State */
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[28px] p-6 shadow-soft border border-white/70 dark:border-slate-800 text-center space-y-5 my-auto">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center mx-auto text-3xl shadow-md">
                🪔
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Welcome to my<span className="text-city-blue">Citi</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  Sign in to save pandals, get real-time festive announcements, and post advertisements.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLogin) onOpenLogin();
                }}
                className="w-full min-h-[48px] rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Continue with Google</span>
              </button>

              <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                <p>Free, fast, and works offline as a PWA.</p>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Bottom Area (Always visible) */}
        <div className="p-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-t border-white/60 dark:border-slate-800/80 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="w-full min-h-[44px] rounded-full bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 border border-rose-200/60 dark:border-rose-900/40 cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          )}

          <div className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500">
            myCiti • v1.2.0 PWA
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[3600] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-xs w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto text-lg font-black">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                Log Out?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to log out of your myCiti account?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 min-h-[40px] rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsLogoutConfirmOpen(false);
                  onClose();
                  await handleLogout();
                }}
                className="flex-1 min-h-[40px] rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
