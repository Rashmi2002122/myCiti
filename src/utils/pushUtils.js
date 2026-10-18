import { fetchVapidKey, subscribePush } from '../services/api';

/**
 * Converts a base64 string to a Uint8Array for VAPID applicationServerKey.
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers browser with ServiceWorker PushManager and syncs subscription with backend.
 */
export async function registerPushSubscription(accessToken) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) {
      console.warn('[Push] pushManager not supported by browser.');
      return null;
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const subscribeOptions = { userVisibleOnly: true };
      try {
        const vapidKey = await fetchVapidKey();
        if (vapidKey && vapidKey.trim().length > 0) {
          subscribeOptions.applicationServerKey = urlBase64ToUint8Array(vapidKey.trim());
        }
      } catch (vapidErr) {
        console.warn('[Push] Failed to fetch VAPID key:', vapidErr);
      }

      sub = await reg.pushManager.subscribe(subscribeOptions);
    }

    if (sub && accessToken) {
      await subscribePush(accessToken, sub);
      console.log('[Push] Successfully registered push subscription with backend.');
    }
    return sub;
  } catch (err) {
    console.warn('[Push] Error subscribing to push:', err);
    return null;
  }
}
