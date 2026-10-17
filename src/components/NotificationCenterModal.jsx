import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Bell, CheckCheck, MapPin, Sparkles, ExternalLink,
  Calendar, Clock, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
  fetchMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/api';
import { requestPushPermissionAndSubscribe } from '../services/pushNotifications';
import { useAuth } from '../context/AuthContext';

export default function NotificationCenterModal({
  isOpen,
  onClose,
  onSelectListingId,
  onUnreadCountChanged
}) {
  const { accessToken, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissionState, setPermissionState] = useState(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!accessToken || !isAuthenticated) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await fetchMyNotifications(accessToken);
      setNotifications(data);
      const unread = data.filter((n) => !n.isRead).length;
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

  const handleEnablePhoneAlerts = async () => {
    if (!('Notification' in window)) {
      alert('Your browser or phone does not support web notifications.');
      return;
    }
    try {
      setIsRequestingPermission(true);
      const res = await requestPushPermissionAndSubscribe(accessToken);
      setPermissionState(res.status);
      if (res.status === 'granted') {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          await reg.showNotification('myCiti Phone Alerts Enabled! 🎉', {
            body: 'You will now receive community announcements and alerts directly on your phone even when the app is closed.',
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag: 'myciti-alert-test',
            renotify: true
          });
        } else {
          new Notification('myCiti Phone Alerts Enabled! 🎉', {
            body: 'You will now receive community announcements and alerts directly on your phone.',
            icon: '/icon.svg'
          });
        }
      } else if (res.status === 'denied') {
        alert('Notification permission was blocked in browser settings. Please allow notifications in site settings to receive phone alerts.');
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  if (!isOpen) return null;

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(accessToken, id);
      setNotifications((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        const unread = next.filter((n) => !n.isRead).length;
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
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onUnreadCountChanged) onUnreadCountChanged(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }

    if (notif.actionUrl) {
      const match = notif.actionUrl.match(/listingId=([0-9]+)/);
      if (match && match[1] && onSelectListingId) {
        onClose();
        onSelectListingId(Number(match[1]));
        return;
      }
      if (notif.actionUrl.startsWith('http')) {
        window.open(notif.actionUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative my-6 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-city-blue/10 text-city-blue flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Notifications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Local announcements and community updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="px-2.5 py-1 text-[11px] font-bold text-city-blue hover:bg-sky-50 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Read all</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {/* Phone Notification Bar Banner */}
          {permissionState !== 'granted' ? (
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
                    Show instant popups in your phone's notification bar
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleEnablePhoneAlerts}
                disabled={isRequestingPermission}
                className="px-3 py-1.5 rounded-full bg-city-blue hover:bg-blue-600 text-white font-extrabold text-xs shadow-xs transition-transform active:scale-95 flex-shrink-0 disabled:opacity-50"
              >
                {isRequestingPermission ? 'Enabling...' : 'Enable'}
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Phone notification bar alerts active</span>
              </span>
              <button
                type="button"
                onClick={handleEnablePhoneAlerts}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
              >
                Send Test Alert
              </button>
            </div>
          )}

          {isLoading && (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
              Loading announcements...
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
                No new announcements for your area right now. Important neighborhood alerts will appear here.
              </p>
            </div>
          )}

          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                !notif.isRead
                  ? 'bg-sky-50/70 dark:bg-blue-950/30 border-sky-200 dark:border-blue-900/60'
                  : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {/* Unread dot */}
              {!notif.isRead && (
                <span className="w-2 h-2 rounded-full bg-city-blue absolute top-3.5 right-3.5" />
              )}

              <div className="w-8 h-8 rounded-xl bg-city-blue/10 text-city-blue flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>

              <div className="flex-1 space-y-1 pr-3">
                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 leading-snug">
                  {notif.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {notif.body}
                </p>
                <div className="text-[10px] text-slate-400 pt-1 flex items-center gap-2">
                  <span>
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Recent'}
                  </span>
                  {notif.actionUrl && (
                    <span className="text-city-blue font-bold flex items-center gap-0.5">
                      <span>Tap to view</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
