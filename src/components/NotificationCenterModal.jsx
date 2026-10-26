import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Bell, CheckCheck, Sparkles, ExternalLink,
  CheckCircle2, AlertCircle, Trash2, Sliders,
  Check, RefreshCw, ShieldAlert
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  registerPushSubscription,
  unsubscribePushSubscription,
  isPushSubscribed
} from '../utils/pushUtils';
import {
  NOTIFICATION_CATEGORIES,
  getNotificationPreferences,
  saveNotificationPreferences
} from '../utils/notificationPrefs';

export default function NotificationCenterModal({
  isOpen,
  onClose,
  onSelectListingId,
  onUnreadCountChanged,
  initialTab = 'announcements'
}) {
  const { accessToken, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'announcements' | 'preferences'
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Push notification state
  const [permissionState, setPermissionState] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [isPushActive, setIsPushActive] = useState(false);
  const [isPushToggling, setIsPushToggling] = useState(false);

  // Category preferences state
  const [categoryPrefs, setCategoryPrefs] = useState(() => getNotificationPreferences());
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isNotificationUnread = (n) => !(n.read ?? n.isRead);

  // Sync push subscription status on open
  useEffect(() => {
    if (!isOpen) return;
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
      isPushSubscribed().then((subscribed) => {
        setIsPushActive(subscribed && Notification.permission === 'granted');
      });
    }
  }, [isOpen]);

  const loadNotifications = useCallback(async () => {
    if (!accessToken || !isAuthenticated) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await fetchNotifications(accessToken);
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      const unread = list.filter(isNotificationUnread).length;
      if (onUnreadCountChanged) onUnreadCountChanged(unread);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setError('Unable to load notifications.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isAuthenticated, onUnreadCountChanged]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadNotifications();
    }
  }, [isOpen, isAuthenticated, loadNotifications]);

  const handleTogglePush = async () => {
    if (!('Notification' in window)) {
      alert('Your browser or phone does not support web notifications.');
      return;
    }

    try {
      setIsPushToggling(true);

      // If already active, turn it off
      if (isPushActive) {
        await unsubscribePushSubscription(accessToken);
        setIsPushActive(false);
        return;
      }

      // Otherwise turn it on
      const perm = await Notification.requestPermission();
      setPermissionState(perm);

      if (perm === 'granted') {
        if (accessToken) {
          await registerPushSubscription(accessToken);
        }
        setIsPushActive(true);

        // Show welcome push alert
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification('myCiti Phone Alerts Enabled! 🎉', {
            body: 'You will now receive community announcements and alerts directly on your phone.',
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: 'myciti-alert-test',
            renotify: true
          });
        }
      } else if (perm === 'denied') {
        alert(
          'Notifications are blocked in your browser settings. To enable, click the lock/settings icon beside the URL in your browser and set Notifications to "Allow".'
        );
      }
    } catch (err) {
      console.error('Failed to toggle push notifications:', err);
    } finally {
      setIsPushToggling(false);
    }
  };

  const handleToggleCategory = (catId) => {
    const updated = {
      ...categoryPrefs,
      [catId]: !categoryPrefs[catId]
    };
    setCategoryPrefs(updated);
    saveNotificationPreferences(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSetAllCategories = (enabled) => {
    const updated = {
      PANDAL: enabled,
      MELA: enabled,
      OFFER: enabled,
      INAUGURATION: enabled
    };
    setCategoryPrefs(updated);
    saveNotificationPreferences(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  if (!isOpen) return null;

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(accessToken, id);
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n));
        const unread = next.filter(isNotificationUnread).length;
        if (onUnreadCountChanged) onUnreadCountChanged(unread);
        return next;
      });
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead(accessToken);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      if (onUnreadCountChanged) onUnreadCountChanged(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      setNotifications((prev) => {
        const next = prev.filter((n) => n.id !== id);
        const unread = next.filter(isNotificationUnread).length;
        if (onUnreadCountChanged) onUnreadCountChanged(unread);
        return next;
      });
      await deleteNotification(accessToken, id);
    } catch (err) {
      console.warn('Failed to delete notification:', err);
      loadNotifications();
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all notifications from your notification center?')) return;
    try {
      setNotifications([]);
      if (onUnreadCountChanged) onUnreadCountChanged(0);
      await clearAllNotifications(accessToken);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notif) => {
    if (isNotificationUnread(notif)) {
      await handleMarkAsRead(notif.id);
    }

    const url = notif.linkUrl || notif.actionUrl;
    if (url) {
      const match = url.match(/listingId=([0-9]+)/);
      if (match && match[1] && onSelectListingId) {
        onClose();
        onSelectListingId(Number(match[1]));
        return;
      }
      if (url.startsWith('http')) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const unreadCount = notifications.filter(isNotificationUnread).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Notification Center and Preferences"
      className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-[#10141c] rounded-[24px] max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#303139] animate-in zoom-in-95 duration-160 relative my-6 flex flex-col max-h-[85vh] text-slate-900 dark:text-[#f4f5f7]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-[#303139] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] text-[#ff951f] flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-medium tracking-tight text-slate-900 dark:text-[#f4f5f7]">
                Notifications
              </h2>
              <p className="text-xs font-mono text-slate-500 dark:text-[#c9ced8]">
                Announcements & Category Preferences
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#101522] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 pb-2 bg-slate-100/60 dark:bg-[#101522] border-b border-slate-200 dark:border-[#303139] flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-white dark:bg-[#10141c] text-[#ff951f] border border-slate-200 dark:border-[#ff951f]/40 font-mono shadow-xs'
                : 'text-slate-600 dark:text-[#c9ced8] hover:text-slate-900 dark:hover:text-[#f4f5f7] font-mono'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Announcements</span>
            {unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-white dark:bg-[#10141c] text-[#ff951f] border border-slate-200 dark:border-[#ff951f]/40 font-mono shadow-xs'
                : 'text-slate-600 dark:text-[#c9ced8] hover:text-slate-900 dark:hover:text-[#f4f5f7] font-mono'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preferences</span>
          </button>
        </div>

        {/* Tab 1: Announcements Content */}
        {activeTab === 'announcements' && (
          <>
            {/* Announcements Actions Subbar */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                <span className="text-slate-400 font-medium">
                  {notifications.length} notification{notifications.length > 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-xs font-bold text-city-blue hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Read all</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear all</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {/* Phone Notification Bar Banner if not granted */}
              {permissionState !== 'granted' && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/90 dark:to-slate-800/60 border border-blue-200/60 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-city-blue text-white flex items-center justify-center flex-shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Get alerts on your phone
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Enable push alerts for instant neighborhood updates
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePush}
                    disabled={isPushToggling}
                    className="px-3 py-1.5 rounded-full bg-[#ff951f] hover:bg-[#e07f12] text-black font-bold text-xs shadow-xs transition-transform active:scale-95 flex-shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    {isPushToggling ? 'Enabling...' : 'Enable'}
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="py-12 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-city-blue" />
                  <span>Loading announcements...</span>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!isLoading && notifications.length === 0 && (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    All caught up!
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    No new announcements right now. Check back soon for pandal schedules, local melas, and offers.
                  </p>
                </div>
              )}

              {notifications.map((notif) => {
                const unread = isNotificationUnread(notif);
                const content = notif.message || notif.body;
                const targetUrl = notif.linkUrl || notif.actionUrl;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative group ${
                      unread
                        ? 'bg-sky-50/70 dark:bg-blue-950/30 border-sky-200 dark:border-blue-900/60'
                        : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {/* Unread dot */}
                    {unread && (
                      <span className="w-2 h-2 rounded-full bg-city-blue absolute top-3.5 right-3.5" />
                    )}

                    <div className="w-8 h-8 rounded-xl bg-city-blue/10 text-city-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>

                    <div className="flex-1 space-y-1 pr-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 leading-snug">
                          {notif.title}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notif.id);
                          }}
                          title="Delete notification"
                          aria-label="Delete notification"
                          className="opacity-60 hover:opacity-100 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {content && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {content}
                        </p>
                      )}
                      <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-2">
                        <span>
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                        {targetUrl && (
                          <span className="text-city-blue font-bold flex items-center gap-0.5">
                            <span>Tap to view</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Tab 2: Preferences Content */}
        {activeTab === 'preferences' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Master Push Notification Switch */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50/50 dark:from-slate-800 dark:to-slate-850 border border-sky-100 dark:border-slate-700">
              <div className="flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      Push Notifications
                    </span>
                    {permissionState === 'denied' && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                        Blocked
                      </span>
                    )}
                    {isPushActive && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Deliver instant updates to your device even when the app is in the background
                  </p>
                </div>

                {/* Master Push Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isPushActive}
                  aria-label="Toggle push notifications"
                  disabled={isPushToggling || permissionState === 'unsupported'}
                  onClick={handleTogglePush}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer flex-shrink-0 disabled:opacity-50 ${
                    isPushActive
                      ? 'bg-[#ff951f] justify-end'
                      : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </button>
              </div>

              {permissionState === 'denied' && (
                <div className="mt-3 p-2.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 text-[11px] text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Notifications are blocked in your browser. Tap the site settings/padlock icon in your browser URL bar to change permission to <strong>Allow</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* Category Preferences Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Category Preferences
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Choose which community categories trigger alerts for you
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSetAllCategories(true)}
                    className="text-[11px] font-bold text-city-blue hover:underline cursor-pointer"
                  >
                    All on
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => handleSetAllCategories(false)}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    All off
                  </button>
                </div>
              </div>

              {/* Category Cards */}
              <div className="space-y-2">
                {NOTIFICATION_CATEGORIES.map((cat) => {
                  const isChecked = Boolean(categoryPrefs[cat.id]);

                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleToggleCategory(cat.id)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 shadow-2xs'
                          : 'bg-slate-50/60 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0" role="img" aria-label={cat.label}>
                          {cat.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {cat.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {cat.description}
                          </div>
                        </div>
                      </div>

                      {/* iOS Style Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        aria-label={`Toggle alerts for ${cat.label}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleCategory(cat.id);
                        }}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer flex-shrink-0 ${
                          isChecked
                            ? 'bg-[#ff951f] justify-end'
                            : 'bg-slate-300 dark:bg-slate-700 justify-start'
                        }`}
                      >
                        <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {savedSuccess && (
                <div className="text-center py-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Preferences saved automatically</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
