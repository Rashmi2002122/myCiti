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
  onOpenProfile,
  onOpenCompleteProfile,
  onOpenMyPosts,
  onOpenPostAd,
  onOpenCampaigns,
  onOpenAdmin,
  onOpenNotifications,
  onOpenLogin,
  onOpenBecomeClient,
  onOpenDeclineInfo,
  onOpenSettings,
  onOpenBusinessProfile,
  darkMode,
  onToggleDarkMode,
  triggerRef
}) {
  const { user, accessToken, isAuthenticated, handleLogout } = useAuth();

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
        return;
      }

      if (e.key === 'Tab' && drawerElement) {
        const focusable = drawerElement.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
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
    // Everyone signed in: Unified Profile
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      roles: ['USER', 'CLIENT', 'ADMIN'],
      action: () => {
        onClose();
        if (onOpenProfile) {
          onOpenProfile();
        } else if (onOpenCompleteProfile) {
          onOpenCompleteProfile();
        }
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
        if (latestClientRequest?.status === 'DECLINED' || latestClientRequest?.status === 'PENDING') {
          if (onOpenDeclineInfo) onOpenDeclineInfo(latestClientRequest);
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
        if (onOpenSettings) {
          onOpenSettings();
        } else if (onOpenNotifications) {
          onOpenNotifications('preferences');
        }
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
        className="fixed top-0 bottom-0 left-0 z-[3001] w-[84vw] max-w-[360px] sm:w-[350px] bg-slate-50 dark:bg-[#07090e] border-r border-slate-200 dark:border-[#303139] flex flex-col h-full overflow-hidden animate-in slide-in-from-left duration-160 ease-out motion-reduce:animate-none font-sans text-slate-900 dark:text-[#f4f5f7]"
      >
        {/* Drawer Header Controls */}
        <div className="pt-[max(1rem,env(safe-area-inset-top))] px-5 pb-3 flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-500 dark:text-[#c9ced8]">
            Account Menu
          </span>
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={onToggleDarkMode}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle color theme"
              className="w-9 h-9 rounded-full bg-white dark:bg-[#10141c] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] cursor-pointer active:scale-95"
            >
              {darkMode ? <Sun className="w-4 h-4 text-[#edcd8c]" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="w-9 h-9 rounded-full bg-white dark:bg-[#10141c] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-2 space-y-3.5 no-scrollbar">
          {isAuthenticated && user ? (
            <>
              {/* User Identity Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  onClose();
                  if (onOpenProfile) onOpenProfile();
                  else if (onOpenCompleteProfile) onOpenCompleteProfile();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClose();
                    if (onOpenProfile) onOpenProfile();
                    else if (onOpenCompleteProfile) onOpenCompleteProfile();
                  }
                }}
                className="bg-white dark:bg-[#10141c] rounded-[5px] p-4 border border-slate-200 dark:border-[#303139] space-y-3 cursor-pointer hover:border-[#ff951f]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {user.pictureUrl ? (
                    <img
                      src={user.pictureUrl}
                      alt={user.name || 'User'}
                      className="w-13 h-13 rounded-full object-cover ring-2 ring-slate-100 dark:ring-[#303139] shadow-sm flex-shrink-0"
                    />
                  ) : (
                    <div className="w-13 h-13 rounded-full bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] text-[#ff951f] flex items-center justify-center text-lg font-bold shadow-sm flex-shrink-0">
                      {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-base font-medium tracking-tight text-slate-900 dark:text-[#f4f5f7] truncate">
                        {user.name || 'myCiti Member'}
                      </h2>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${roleBadge.badgeClass}`}>
                        {roleBadge.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-[#c9ced8] font-mono truncate mt-0.5">
                      {user.email}
                    </p>

                    {/* Business Name for CLIENT */}
                    {role === 'CLIENT' && user.businessName && (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                        <Store className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{user.businessName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Row */}
                <div className="pt-2 border-t border-slate-100 dark:border-[#303139]">
                  {isLoadingCounts && !counts ? (
                    <div className={`grid ${role === 'CLIENT' ? 'grid-cols-3' : 'grid-cols-2'} gap-2 animate-pulse`}>
                      <div className="h-10 bg-slate-100 dark:bg-[#101522] rounded-[4px] border border-slate-200 dark:border-[#303139]" />
                      <div className="h-10 bg-slate-100 dark:bg-[#101522] rounded-[4px] border border-slate-200 dark:border-[#303139]" />
                      {role === 'CLIENT' && (
                        <div className="h-10 bg-slate-100 dark:bg-[#101522] rounded-[4px] border border-slate-200 dark:border-[#303139]" />
                      )}
                    </div>
                  ) : role === 'USER' ? (
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onNavigate) onNavigate('saved');
                        }}
                        className="p-2 rounded-[4px] bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 transition-colors"
                      >
                        <div className="text-sm font-mono font-bold text-amber-700 dark:text-[#edcd8c] tabular-nums">
                          {counts?.savedCount ?? 0}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-[#c9ced8] uppercase tracking-wider">
                          Saved
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenNotifications) onOpenNotifications('preferences');
                        }}
                        className="p-2 rounded-[4px] bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 transition-colors"
                      >
                        <div className="text-sm font-mono font-bold text-[#ff951f]">
                          Active
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-[#c9ced8] uppercase tracking-wider">
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
                        className="p-1.5 rounded-[4px] bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 transition-colors"
                      >
                        <div className="text-sm font-mono font-bold text-amber-700 dark:text-[#edcd8c] tabular-nums">
                          {(counts?.approvedCount || 0) + (counts?.pendingCount || 0)}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-[#c9ced8] uppercase tracking-wider">
                          Posts
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenMyPosts) onOpenMyPosts();
                        }}
                        className="p-1.5 rounded-[4px] bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 transition-colors"
                      >
                        <div className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {counts?.approvedCount ?? 0}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-[#c9ced8] uppercase tracking-wider">
                          Approved
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenMyPosts) onOpenMyPosts();
                        }}
                        className="p-1.5 rounded-[4px] bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 transition-colors"
                      >
                        <div className="text-sm font-mono font-bold text-[#ff951f] tabular-nums">
                          {counts?.pendingCount ?? 0}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-[#c9ced8] uppercase tracking-wider">
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
                        className="p-2 rounded-[4px] bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 transition-colors"
                      >
                        <div className="text-sm font-mono font-bold text-[#ff951f] tabular-nums">
                          {counts?.pendingReviewCount ?? 0}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-[#c9ced8] uppercase tracking-wider">
                          To Review
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          if (onOpenAdmin) onOpenAdmin('CLIENT_REQUESTS');
                        }}
                        className="p-2 rounded-[4px] bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 transition-colors"
                      >
                        <div className="text-sm font-mono font-bold text-amber-700 dark:text-[#edcd8c] tabular-nums">
                          {counts?.pendingClientRequestCount ?? 0}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-[#c9ced8] uppercase tracking-wider">
                          Client Reqs
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Menu List */}
              <div className="bg-white dark:bg-[#10141c] rounded-[5px] p-1.5 border border-slate-200 dark:border-[#303139] divide-y divide-slate-100 dark:divide-[#303139]">
                {visibleMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isSpecial = item.isSpecial;

                  return (
                    <div key={item.id} className="p-0.5">
                      <button
                        type="button"
                        onClick={item.action}
                        className={`w-full min-h-[48px] px-3 rounded-[4px] flex items-center justify-between gap-3 text-left transition-all active:scale-[0.99] cursor-pointer ${
                          isSpecial
                            ? 'bg-[#ff951f]/15 text-[#ff951f] font-medium hover:bg-[#ff951f]/25'
                            : 'text-slate-800 dark:text-[#f4f5f7] hover:bg-slate-50 dark:hover:bg-[#101522] font-normal'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center flex-shrink-0 ${
                            isSpecial
                              ? 'bg-[#ff951f] text-[#07090e]'
                              : 'bg-slate-100 dark:bg-[#101522] text-slate-600 dark:text-[#c9ced8] border border-slate-200 dark:border-[#303139]'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-medium tracking-tight">
                            {item.label}
                          </span>
                        </div>

                        {/* Badges / Status Pills */}
                        <div className="flex items-center gap-1.5">
                          {/* "Become a client" special pill status */}
                          {item.id === 'become_client' && (
                            latestClientRequest?.status === 'PENDING' ? (
                              <div className="flex items-center gap-1">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 dark:bg-[#101522] text-amber-700 dark:text-[#edcd8c] border border-slate-200 dark:border-[#303139]">
                                  Under review
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenDeclineInfo) onOpenDeclineInfo(latestClientRequest);
                                  }}
                                  aria-label="View request details"
                                  className="w-6 h-6 rounded-full bg-slate-100 dark:bg-[#101522] text-amber-700 dark:text-[#edcd8c] border border-slate-200 dark:border-[#303139] flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                  <Info className="w-3.5 h-3.5 stroke-[2.2]" />
                                </button>
                              </div>
                            ) : latestClientRequest?.status === 'DECLINED' ? (
                              <div className="flex items-center gap-1">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                                  Declined
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onOpenDeclineInfo) onOpenDeclineInfo(latestClientRequest);
                                  }}
                                  aria-label="View decline reason"
                                  className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center hover:scale-110 transition-transform"
                                >
                                  <Info className="w-3.5 h-3.5 stroke-[2.2]" />
                                </button>
                              </div>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#ff951f] text-[#07090e]">
                                Apply
                              </span>
                            )
                          )}

                          {/* Numeric Badges */}
                          {item.badgeKey && counts?.[item.badgeKey] > 0 && (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-mono font-bold bg-[#ff951f] text-[#07090e] flex items-center justify-center">
                              {counts[item.badgeKey]}
                            </span>
                          )}

                          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#c9ced8] opacity-60" />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Collapsible Help & Support Section */}
              <div className="bg-white dark:bg-[#10141c] rounded-[5px] p-1.5 border border-slate-200 dark:border-[#303139]">
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(!isHelpOpen)}
                  className="w-full min-h-[46px] px-3.5 rounded-[4px] flex items-center justify-between text-left text-xs font-medium text-slate-700 dark:text-[#c9ced8] hover:bg-slate-50 dark:hover:bg-[#101522] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-slate-500 dark:text-[#c9ced8]" />
                    <span>Help & Support</span>
                  </div>
                  {isHelpOpen ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-[#c9ced8]" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-[#c9ced8]" />}
                </button>

                {isHelpOpen && (
                  <div className="pt-2 pb-1 px-2 space-y-1 text-xs border-t border-slate-100 dark:border-[#303139] animate-in slide-in-from-top-2 duration-150">
                    <a
                      href="mailto:admin@myciti.com?subject=myCiti%20Help%20and%20Support"
                      className="flex items-center justify-between p-2 rounded-[4px] text-slate-600 dark:text-[#c9ced8] hover:bg-slate-50 dark:hover:bg-[#101522] font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#ff951f]" />
                        <span>Contact Admin</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-[#c9ced8]">admin@myciti.com</span>
                    </a>

                    <div className="p-2 rounded-[4px] text-slate-600 dark:text-[#c9ced8] font-normal">
                      <div className="text-[11px] font-medium text-slate-800 dark:text-[#f4f5f7]">About myCiti</div>
                      <p className="text-[10px] text-slate-500 dark:text-[#c9ced8] mt-0.5 leading-relaxed">
                        India's community guide for pandals, artisan melas, and neighborhood offers.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Signed Out State */
            <div className="bg-white dark:bg-[#10141c] rounded-[5px] p-6 border border-slate-200 dark:border-[#303139] text-center space-y-4 my-auto">
              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] text-amber-600 dark:text-[#edcd8c] flex items-center justify-center mx-auto text-2xl shadow-md">
                🪔
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-slate-900 dark:text-[#f4f5f7]">
                  Welcome to my<span className="text-[#ff951f]">Citi</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#c9ced8] leading-relaxed max-w-xs mx-auto">
                  Sign in to save pandals, get real-time festive announcements, and post advertisements.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenLogin) onOpenLogin();
                }}
                className="w-full min-h-[46px] rounded-full bg-[#ff951f] hover:bg-[#e68416] text-[#07090e] font-semibold text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Continue with Google</span>
              </button>

              <div className="pt-1 text-[11px] font-mono text-slate-400 dark:text-[#c9ced8] space-y-1">
                <p>Free, fast, and works offline as a PWA.</p>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Bottom Area (Always visible) */}
        <div className="p-4 bg-slate-100/90 dark:bg-[#07090e] border-t border-slate-200 dark:border-[#303139] pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="w-full min-h-[42px] rounded-full bg-white dark:bg-[#10141c] hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-medium text-xs transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-[#303139] hover:border-rose-300 dark:hover:border-rose-900/50 cursor-pointer active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          )}

          <div className="text-center text-[10px] font-mono font-medium text-slate-400 dark:text-[#c9ced8]/60">
            myCiti • v2.0.0
          </div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[3600] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#10141c] rounded-[5px] max-w-xs w-full p-6 border border-slate-200 dark:border-[#303139] text-center space-y-4 animate-in zoom-in-95 text-slate-900 dark:text-[#f4f5f7]">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center mx-auto text-lg font-bold">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-medium text-slate-900 dark:text-[#f4f5f7]">
                Log Out?
              </h4>
              <p className="text-xs text-slate-500 dark:text-[#c9ced8]">
                Are you sure you want to log out of your myCiti account?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="flex-1 min-h-[40px] rounded-full text-xs font-medium text-slate-700 dark:text-[#c9ced8] hover:bg-slate-100 dark:hover:bg-[#101522] border border-slate-200 dark:border-[#303139] transition-colors"
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
                className="flex-1 min-h-[40px] rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors"
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
